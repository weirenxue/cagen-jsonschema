const Validator = require('jsonschema').Validator;
const path = require("path");
const fs = require('fs');

const rootFolder = "E:\\Waste\\data_all";
var v = new Validator();

const readFilePromise = file => {
    return new Promise((resolve, reject) => {
        fs.readFile(file, 'UTF8', (err, data) => {
            resolve(data);
        });
    });
}

const fsAccessPromise = file => {
    return new Promise((resolve, reject) => {
        fs.access(file, fs.F_OK, (err) => {
            if(err) {
                reject(err);
                return;
            }
            resolve();
        })
    });
}

let recordClasses = [
    "基本資料",
    "課程學習成果",
    "多元表現",
    "修課紀錄",
]
let startString = `${new Date(Date.now()).toLocaleDateString()} ${new Date(Date.now()).toLocaleTimeString()}`;
let startUnixtime = Date.now();
console.log(`${startString}`)

let proc = async () => {
    let schema = JSON.parse(fs.readFileSync('schema.json', 'UTF8').trim())
    let refSchema = JSON.parse(fs.readFileSync('refSchema.json', 'UTF8').trim());
    for(let [_, value] of Object.entries(refSchema)){
        v.addSchema(value, value.id)
    }
    // console.log(schema);
    let IDs = JSON.parse(fs.readFileSync(path.join(rootFolder, 'index.json'), 'UTF8').trim());
    let Ps = [];
    IDs.forEach(id => {
        recordClasses.forEach(recordClass => {
            let filePath = path.join(rootFolder, id.substring(id.length - 3), id, `${id}_${recordClass}.json`);
            let f = async () => {
                await fsAccessPromise(filePath)
                .then(() => {
                    let data = fs.readFileSync(filePath, 'UTF8')
                    let result = v.validate(JSON.parse(data.trim()), schema[recordClass]);
                    if(result.valid === false){
                        console.log(filePath);
                        console.log(result.errors);
                    }
                })
                .catch((err) => {
                    console.debug(err);
                });
            }
            Ps.push(f());
        });
    });
    Promise.all(Ps).then(
        ()=> {
            let endString = `${new Date(Date.now()).toLocaleDateString()} ${new Date(Date.now()).toLocaleTimeString()}`;
            let endUnixtime = Date.now();
            console.log(`開始:${startString}\n結束:${endString}`)
        }
    )
}
proc();