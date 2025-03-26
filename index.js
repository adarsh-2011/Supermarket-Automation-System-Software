// Importing and running express
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// Importing JSON files
const itemData = require('./data.json');

// Parse any data coming from a form or as a JSON
app.use(express.urlencoded({ extended : true}))
app.use(express.json())

//Setting view engine to EJS
app.set('view engine','ejs');

//Setting path for views and public assets
app.set('views', path.join(__dirname, '/views'))
app.use(express.static(path.join(__dirname, 'public')))

//Defining variables and objects
/*
**** Objects and Functions
*/
// Billing Details Object
let billObject = {
    "totalItems" : 0,
    "items" : []
}
// Sales Statistics Object
let stats = [];
let names = [];
let sales = [];
let startYear = 1998;
let endYear = 1998;
// JSON File Paths
const dataFilePath = './data.json';
const credFilePath = '/data/credentials.json';

// Function to write in a json file
function writeDataJSON(jsonFile){
    var newData = JSON.stringify(jsonFile);
    try{
        fs.writeFile('data.json', newData, err => {
            // error checking
            if(err) throw err;
            console.log("New data added");
        });  
    }
    catch(e){
        console.log("Error detected in file handling",e);
    }
}

// Routing methods for CRUD operations
app.get('/',(req,res) =>{
    res.redirect('login');
})
app.get('/login',(req,res) =>{
    res.render('login');
})

/* **********************************
Role Based routing
******************************* */
app.get('/home/staff',(req,res) =>{
    res.render('index');
})
app.get('/home/clerk',(req,res) =>{
    res.render('clerk_index');
})
app.get('/home/manager',(req,res) =>{
    res.render('manager_index');
})
/* ********************************
GET Request Routing
*********************************** 
*/

//*********************** Staff Portal ***********************
app.get('/home/info',(req,res) =>{
    res.render('item_info',{itemData});
})
app.get('/home/add',(req,res) =>{
    res.render('add_items',{itemData});
})
app.get('/home/modify',(req,res) =>{
    console.log(itemData);
    console.log("Inside modify GET route");
    res.render('modify_items',{itemData});
})
app.get('/home/delete',(req,res) =>{
    res.render('modify_items',{itemData});
})

//*********************** Sales Clerk Portal ***********************
app.get('/home/billing',(req,res) =>{
    billObject.totalItems = 0;
    billObject.items = [];
    res.render('bill_items',{itemData, billObject});
})

//*********************** Manager ***********************
app.get('/home/pricing',(req,res) =>{
    res.render('update_price',{itemData});
})
app.get('/home/statistics',(req,res) =>{
    stats=[];
    sales=[];
    names=[];
    startYear = 1998;
    endYear = 1998;
    res.render('sales_statistics',{stats,startYear, endYear, names, sales});
})

/* ********************************
POST Request Routing
*********************************** 
*/
//*********************** Portal Login ***********************
app.post('/home',(req,res) =>{
    console.log(req.body);
    const role = req.body.role;
    if(role === 'manager'){
        res.redirect('home/manager');
    }
    else if(role === 'clerk'){
        res.redirect('home/clerk');
    }
    else if(role === 'staffs'){
        res.redirect('home/staff');
    }
})

//*********************** Staff Portal ***********************
app.post('/home/add',(req,res) =>{
    console.log(req.body);
    let itemIndex = itemData.items.length;
    let itemId = itemData.items[itemIndex-1].id + Math.ceil(1+ Math.random()*9);

    const itemName = req.body.name;
    const itemQty = parseInt(req.body.qty);
    const unit = req.body.unit;
    const itemPrice = parseInt(req.body.price);
    const category = req.body.category;
    // console.log(itemId, itemName, itemQty, unit, itemPrice, category);
    itemData.items.push({id:itemId, name:itemName, quantity:itemQty, unit:unit, unitPrice:itemPrice, category:category});
    console.log("Item added to inventory");

    //Writing to data.json file
    writeDataJSON(itemData);

    res.render('add_items',{itemData});
})
app.post('/home/modify', (req,res) =>{
    console.log(req.body);
    const itemId = parseInt(req.body.modId);
    const quantity = parseInt(req.body.quantity);

    for(item of itemData.items){
        if(itemId === item.id){
            item.quantity = quantity;
            console.log("Updated Item Details");
        }
    }

    //Writing to data.json file
    writeDataJSON(itemData);

    res.render('modify_items',{itemData});
})
app.post('/home/delete', (req,res) =>{
    const itemId = parseInt(req.body.deleteId);

    // One liner delete operation
    itemData.items = itemData.items.filter(item => item.id !== itemId);
    console.log("Item ID to be removed:", itemId);

    //Writing to data.json file
    writeDataJSON(itemData);

    res.render('modify_items',{itemData});
})

//*********************** Sales Clerk Portal ***********************
app.post('/home/billing',(req,res) =>{
    // console.log(req.body);
    let { itemId, qty } = req.body;
    itemId = parseInt(itemId);
    qty = parseInt(qty);

    const itemDetails = (itemData.items.filter(item => item.id === itemId))[0];
    // console.log(itemDetails);
    // console.log(itemDetails.quantity, qty);

    if(qty <= itemDetails.quantity){
        billObject.totalItems++;
        let billItem = {
            "id": parseInt(itemDetails.id),
            "name": itemDetails.name,
            "quantity": parseInt(qty),
            "unit": itemDetails.unit,
            "unitPrice": parseInt(itemDetails.unitPrice),
            "category": itemDetails.category 
        }
        billObject.items.push(billItem);

        for(let item of itemData.items){
            if(item.id === itemId){
                item.quantity-= qty;
                console.log("Inventory Item Updated:", itemData.items);
            }
        }
    }
    else{
        console.log("Quantity exceeds available quantity")
    }

    res.render('bill_items',{itemData, billObject});
})
app.post('/home/billing/receipt',(req,res) =>{
    // console.log(itemId, itemName, itemQty, unit, itemPrice, category);
    let salesIndex = itemData.sales.length;
    let txnNo = itemData.sales[salesIndex-1].txnNo + Math.ceil(1+ Math.random()*9);
    let dateObj = new Date();
    let date = dateObj.toISOString().slice(0, 10);
    let time = `${dateObj.getHours()}:${dateObj.getMinutes()} IST`;

    console.log(txnNo,date,time);

    const salesObject = {
        "txnNo" : txnNo,
        "txnDate" : date,
        "txnTime" : time,
        "salesItems" : []
    }
    for(billItem of billObject.items){
        salesObject.salesItems.push(billItem);
    }
    //console.log(salesObject);
    itemData.sales.push(salesObject);
    console.log(itemData.sales);

    //Writing to data.json file
    writeDataJSON(itemData);

    res.render('receipt',{itemData, billObject});
})

//*********************** Manager ***********************
app.post('/home/pricing',(req,res) =>{
    console.log(req.body);
    const itemId = parseInt(req.body.id);
    const price = parseInt(req.body.price);
    console.log(itemId,price);

    for(item of itemData.items){
        if(parseInt(itemId) === item.id){
            item.unitPrice = parseInt(price);
            console.log("Updated Item Price");
            console.log(item.id, item.unitPrice);
        }
    }

    //Writing to data.json file
    writeDataJSON(itemData);

    res.render('update_price',{itemData});
})
app.post('/home/statistics',(req,res) =>{
    stats = [];
    const startYear = req.body.startYear;
    const endYear = req.body.endYear;
    
    for(let item of itemData.items){
        const statItem = {
            "id" : item.id,
            "name" : item.name,
            "unit" : item.unit,
            "sales" : 0
        }
        stats.push(statItem);
    }
    for(let sale of itemData.sales){
        let saleYear = sale.txnDate.slice(0,4);
        if(parseInt(saleYear) >= parseInt(startYear) && parseInt(saleYear) <= parseInt(endYear)){
            for(let item of sale.salesItems){
                const index = stats.map(object => object.id).indexOf(item.id);
                console.log(index, stats.length);
                if(index === -1){
                    const newStatItem = {
                        "id" : item.id,
                        "name" : item.name,
                        "unit" : item.unit,
                        "sales" : item.quantity
                    }
                }
                else{
                    stats[index].sales += item.quantity;
                }
            }
        }
    }
    console.log(stats);

    names = [];
    sales = [];
    for(let stat of stats){
        if(stat.sales !=0){
            names.push(stat.name);
            sales.push(stat.sales);
        }
    }
    console.log(names);
    console.log(sales);
    res.render('sales_statistics',{itemData, startYear, endYear, stats, names, sales});
})
app.post('/home/statistics/print',(req,res) =>{
    res.render('print_statistics',{stats})
})

app.listen(8080, () => {
    console.log('Listening to server at port 8080');
})
