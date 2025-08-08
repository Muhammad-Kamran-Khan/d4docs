// Document.js
const mongoose = require('mongoose');
const { model } = mongoose;

const uri =
  'mongodb+srv://kamran:kamranmongo@cluster0.xluwlpp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const clientOptions = {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  },
};

async function connectDB() {
  try {
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log('You successfully connected to MongoDB!');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}
connectDB();

const documentSchema = new mongoose.Schema({
  _id: String,
  data: Object,
});

module.exports = model("Document", documentSchema)
