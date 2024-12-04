const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const app = express();
const { ObjectId } = require('mongodb');
app.use(cors());
// MongoDB connection URI and database name
const uri = "mongodb+srv://manoraj:Oke3iuJVn923PnQT@cluster0.p9pm1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "Dashboard";
let dbClient;

app.use(express.json());
// Function to connect to MongoDB
async function connectToMongoDB() {
    try {
        // Create MongoClient instance
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log("Connected to MongoDB!");
        dbClient = client; // Store the client in a global variable
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}
connectToMongoDB();

app.get("/api/products", async (req, res) => {
    try {
        if (!dbClient) {
            return res.status(500).send("Database connection is not established yet.");
        }

        // Access the MongoDB database
        const db = dbClient.db(dbName);
        const collection = db.collection('Products'); // Adjust the collection name as needed

        // Example: Retrieve all users from the database
        const documents = await collection.find({}).toArray();

        res.json(documents); // Send the documents as a JSON response
    } catch (error) {
        console.error('Error fetching data from MongoDB:', error);
        res.status(500).send("Internal server error");
    }
});

// Route to insert or update a product based on pro_ID or _id
app.post('/api/products', async (req, res) => {

    try {
        const db = dbClient.db(dbName);
        const collection = db.collection('Products');
        const documents = await collection.find({}).toArray();
        // Create an array of promises for the update/insert operations
        const promises = req.body.map(async (product) => {
            const { _id, pro_Size, pro_ManufacturingCost, pro_RetailAmount } = product;
            console.log(pro_Size, pro_ManufacturingCost, pro_RetailAmount, _id);

            if (_id) {
                console.log(documents.some((doc) => doc._id.equals(new ObjectId(_id))));

                if (documents.some((doc) => doc._id.equals(new ObjectId(_id)))) {
                    // Update existing product
                    const filter = { _id: new ObjectId(_id) }; // Filter to find the document
                    console.log('Filter:', filter);

                    // Prepare the update document
                    const updateDoc = {
                        $set: {
                            pro_Size,
                            pro_ManufacturingCost,
                            pro_RetailAmount
                        },
                    };

                    const result = await collection.updateOne(filter, updateDoc);
                    if (result.matchedCount === 0) {
                        console.log('No document found with the given _id');
                    }
                }
            } else {
                // Insert new product (no _id present)
                if (product._id == undefined) {
                    const newProduct = {
                        pro_Size,
                        pro_ManufacturingCost,
                        pro_RetailAmount,
                    };

                    await collection.insertOne(newProduct);
                }
            }
        });

        // Wait for all promises to resolve
        await Promise.all(promises);

        // Send a success response once all operations are complete
        res.status(200).json({ message: "Products updated/added successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.delete('/api/products/:id', async (req, res) => {  // Add :id to the endpoint
    const index = req.params.id;  // Get the ID from the URL parameters

    try {
        const db = dbClient.db(dbName);
        const collection = db.collection('Products');
        const docs = await collection.find().skip(parseInt(index)).limit(1).toArray();
        // Delete product with the matching pro_ID (from the URL)
        if (docs.length > 0) {
            const docToDelete = docs[0];
            const result = await collection.deleteOne({ _id: docToDelete._id });
            res.status(200).json({ message: `Product with ID ${docToDelete._id} deleted successfully` });
        } else {
            console.log("No document found at the specified index.");
        }
        // Respond with a success message if the product was deleted


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});



app.get("/api/customizeoffer", async (req, res) => {

    try {
        const db = dbClient.db(dbName);
        const collection = db.collection('CustomizeOffer');
        const documents = await collection.find({}).toArray();
        console.log(documents);

        res.json(documents); // Send the documents as a JSON response
    } catch (error) {
        console.error('Error fetching data from MongoDB:', error);
        res.status(500).send("Internal server error");
    }

});


app.post('/api/customizeoffer', async (req, res) => {
    try {
        const db = dbClient.db(dbName);
        const collection = db.collection('CustomizeOffer');
        const result = await collection.insertOne(req.body);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/customizeoffer/:code/orders', async (req, res) => {
    const oferCode = parseInt(req.params.code);
    const newMember = req.body; // The new member data is sent in the request body

    try {
        const db = dbClient.db(dbName);
        const collection = db.collection('CustomizeOffer');
        
        const result = await collection.updateOne(
            { ofr_Code: oferCode }, // Find the team by tea_Id
            { $set: { 
                
                // tea_TotalCoins:newMember.map(val=>parseInt(val.mem_TotalCoins)).reduce((a,b)=>a+b,0),
                // tea_TotalOrder:newMember.map(val=>parseInt(val.mem_TotalOrder)).reduce((a,b)=>a+b,0),
                // tea_TotalEarnings:newMember.map(val=>parseInt(val.mem_TotalEarnings)).reduce((a,b)=>a+b,0),
                // tea_PendingAmount:newMember.map(val=>parseInt(val.mem_PendingAmount)).reduce((a,b)=>a+b,0),
                orders: newMember
             } } // Add the new member to the members array
        );

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: `New member added to Team ${oferCode}`,data:await collection.find({}).toArray() });
        } else {
            res.status(404).json({ message: `Team with ID ${oferCode} not found`,data:{}});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get("/api/teams", async (req, res) => {
    try {
        const db = dbClient.db(dbName);
        const collection = db.collection('Teams');
       
        const document = await collection.find({}).toArray();
        res.json(document); // Send the document as a JSON response
    } catch (error) {
        console.error('Error fetching data from MongoDB:', error);
        res.status(500).send("Internal server error");
    }   
    })

    app.post("/api/teams",async (req,res)=>{
        try{
          const db=dbClient.db(dbName);
          const collection =db.collection('Teams');
          const document = await collection.find({}).toArray();

          req.body.map((val,index)=>{
        
          if(val._id){
                const filter = { _id: new ObjectId(val._id) }; // Filter to find the document
                console.log('Filter:', filter);
                // Prepare the update document
                const updateDoc = {
                    $set: {
                        tea_Id: val.tea_Id,
                        tea_Name: val.tea_Name,
                        tea_LeaderName: val.tea_LeaderName,
                        tea_LeaderCode: val.tea_LeaderCode,
                        tea_Level: val.tea_Level,
                        tea_TotalCoins: val.tea_TotalCoins,
                        tea_TotalOrder: val.tea_TotalOrder,
                        tea_TotalEarnings: val.tea_TotalEarnings,
                        tea_PendingAmount: val.tea_PendingAmount,
                    },
                };

                const result =  collection.updateOne(filter, updateDoc);
            } else{
                 collection.insertOne(val);
                 console.log(val.tea_Id+"inserted");
            }
          })
        }catch(error){

        }
    })

app.delete("/api/leader",async (req,res)=>{
    try {
        const db = dbClient.db(dbName);
        const collection = db.collection('Teams');
        const result = await collection.deleteOne({ _id: new ObjectId(req.body._id)});  
        const document = await collection.find({}).toArray();
      console.log(result);
        
        if(result.deletedCount>0){
            document.map(async (val,index)=>{  
                if(val._id){
                      const filter = { _id: new ObjectId(val._id) }; // Filter to find the document
                    
                      var prefixlcode="";
        
                      if(index+1 < 10){
                         prefixlcode="00"+(index+1);
                      }else if(index+1 > 9 && index+1 < 100 ){
                        prefixlcode="0"+(index+1);
                      }else{
                        prefixlcode=(index+1);
                      }
                     
                      const updateDoc = {
                          $set: {
                              tea_Id: index+1,
                              tea_Name: `Team ${String.fromCharCode(64+index+1) }`,
                              tea_LeaderName: val.tea_LeaderName,
                              tea_LeaderCode: `DDT${String.fromCharCode(64+index+1)}L${prefixlcode}`,
                              tea_Level: val.tea_Level,
                              tea_TotalCoins: val.tea_TotalCoins,
                              tea_TotalOrder: val.tea_TotalOrder,
                              tea_TotalEarnings: val.tea_TotalEarnings,
                              tea_PendingAmount: val.tea_PendingAmount,
                          },
                      };
      
                      await collection.updateOne(filter, updateDoc);
                  }
                })
            res.status(200).json(await collection.find({}).toArray());
          }else{
              res.status(503).json({ message: `Product with ID ${req.body.tea_Id} Not Fount`,delete:false,data:await collection.find({}).toArray()});  
          }
   
      
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
      
})

app.post('/api/teams/:id/member', async (req, res) => {
    const teamId = parseInt(req.params.id);
    const newMember = req.body; // The new member data is sent in the request body

    try {
        const db = dbClient.db(dbName);
        const collection = db.collection('Teams');

        // Update the team document by adding a new member to the 'members' array
        console.log(newMember.map(val=>parseInt(val.mem_TotalOrder)).reduce((a,b)=>a+b,0));
        
        const result = await collection.updateOne(
            { tea_Id: teamId }, // Find the team by tea_Id
            { $set: { 
                
                tea_TotalCoins:newMember.map(val=>parseInt(val.mem_TotalCoins)).reduce((a,b)=>a+b,0),
                tea_TotalOrder:newMember.map(val=>parseInt(val.mem_TotalOrder)).reduce((a,b)=>a+b,0),
                tea_TotalEarnings:newMember.map(val=>parseInt(val.mem_TotalEarnings)).reduce((a,b)=>a+b,0),
                tea_PendingAmount:newMember.map(val=>parseInt(val.mem_PendingAmount)).reduce((a,b)=>a+b,0),
                members: newMember
             } } // Add the new member to the members array
        );

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: `New member added to Team ${teamId}`,data:await collection.find({}).toArray() });
        } else {
            res.status(404).json({ message: `Team with ID ${teamId} not found`,data:{}});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/teams/:id/member/:memId', async (req, res) => {
    const teamId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memId);
    const updatedMember = req.body; // The updated member data is sent in the request body

    try {
        const db = dbClient.db(dbName);
        const collection = db.collection('Teams');

        // Update the member's details in the 'members' array
        const result = await collection.updateOne(
            { tea_Id: teamId, "members.mem_Id": memberId }, // Find the team by tea_Id and the member by mem_Id
            { $set: { "members.$": updatedMember } } // Update the member in the array
        );

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: `Member with ID ${memberId} updated successfully` });
        } else {
            res.status(404).json({ message: `Member with ID ${memberId} not found in Team ${teamId}` });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/teams/:id/member/:memId', async (req, res) => {
    const teamId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memId);

    try {
        const db = dbClient.db(dbName);
        const collection = db.collection('Teams');

        // Remove the member from the 'members' array
        const result = await collection.updateOne(
            { tea_Id: teamId }, // Find the team by tea_Id
            { $pull: { members: { mem_Id: memberId } } } // Remove the member with the given mem_Id
        );

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: `Member with ID ${memberId} removed from Team ${teamId}` });
        } else {
            res.status(404).json({ message: `Member with ID ${memberId} not found in Team ${teamId}` });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


const port = process.env.PORT || 7000;
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
