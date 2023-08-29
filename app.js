const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// running locally
// mongoose.connect("mongodb://localhost:27017/todolistDB"); //, { useNewUrlParser: true, useUnifiedTopology: true } 

// using mongodb atlas
mongoose.connect("mongodb+srv://admin:Pm12345@cluster0.zvhngn3.mongodb.net/todolistDB");


//// ITEM SCHEMA////
const itemsSchema = {
	name: String
};

const Item = mongoose.model("Item", itemsSchema);

////DEFAULT ITEMS////
const item1 = new Item({
	name: "Type a new item below"
});

const item2 = new Item({
	name: "Click the + button to add the new item"
});

const item3 = new Item({
	name: "<--Click this to delete an item"
});


const defaultItems = [item1, item2, item3];

////CUSTOM LIST ITEM SCHEMA////
const listSchema = {
	name: String,
	items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//////HOME ROUTE/////
app.get("/", async function (req, res) {

	const allItems = await Item.find({}).then((result) => {
		if (result.length === 0) {
			Item.insertMany([item1, item2, item3]).then((result) => {
				console.log("Added successfully", result);
			}).catch((err) => {
				console.log("Error", err);
			});
			res.redirect("/")
		} else {
			res.render("list", { listTitle: "Today", newListItems: result });
		}
		console.log("Success!");
	}).catch((err) => {
		console.log(err);
	});;
});

/////ADD NEW ITEM/////
app.post("/", function (req, res) {

	const itemName = req.body.newItem;
	const listName = req.body.list;

	const item = new Item({
		name: itemName
	});

	if (itemName !== "") {

		if (listName === "Today") {
			item.save();
			res.redirect("/");

		} else {

			List.findOne({ name: listName }).then((result) => {
				result.items.push(item)
				result.save();
				res.redirect(`/${listName}`)
			}).catch((err) => {
				console.log("Error", err);
			});
		}
	}

});

/////CUSTOM LIST//////
app.get("/:customListName", function (req, res) {

	const customListName = _.capitalize(req.params.customListName);

	List.findOne({ name: customListName }).then((result) => {
		if (!result) {
			console.log("Dose not found");
			// create new list
			const list = new List({
				name: customListName,
				items: defaultItems
			})
			list.save();
			res.redirect("/" + customListName)
		} else {
			// show existing list
			res.render("list", { listTitle: result.name, newListItems: result.items })
		}
	}).catch((err) => {
		console.log("Error", err);
	});
});


////DELETE ITEM/////
app.post("/delete", async function (req, res) {

	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === "Today") {
		await Item.findByIdAndRemove(checkedItemId).then((result) => {
			console.log("Deleted successfully", result);
			res.redirect("/")
		}).catch((err) => {
			console.log(err);
		});
	} else {
		List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }).then((result) => {
			console.log("Result", result);
			res.redirect("/" + listName);
		}).catch((err) => {
			console.log(err);
		});
	}
});

let port = process.env.PORT;
if (port == null || port == "") {
	port = 3000;
}

app.listen(port, function () {
	console.log("Server has started successfully!");
});







