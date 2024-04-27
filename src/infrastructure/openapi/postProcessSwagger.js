const fs = require("fs");
const path = require("path");


const swaggerFilePath1 = path.join(__dirname, "../../../dist", "swagger.json");
const swaggerFilePath2 = path.join(__dirname, "../../../dist/dist", "swagger.json");

const replaceMap = [
  { find: "%24", replace: "" },
  { find: ".$", replace: "" },
  { find: "%3F%3A", replace: "Optional" },
  { find: "%5C", replace: "_" },
  { find: "%5B", replace: "_" },
  { find: "%5D", replace: "_" },
  { find: "%3A", replace: "_" },
]

function postProcessSwagger(swaggerFilePath) {
  let data = fs.readFileSync(swaggerFilePath, "utf8");
  replaceMap.forEach((item) => {
    data = data.replaceAll(item.find, item.replace);
  });

  fs.writeFileSync(swaggerFilePath, data, "utf8");
  console.log("Post processing of swagger.json completed successfully.");
}

postProcessSwagger(swaggerFilePath1);
postProcessSwagger(swaggerFilePath2);