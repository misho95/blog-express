const mongoose = require("mongoose");

const MONGO_URI =
  "mongodb+srv://misho95:K4RJO5JvQoTkDkCX@express-blog.kabpmog.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

//   K4RJO5JvQoTkDkCX
