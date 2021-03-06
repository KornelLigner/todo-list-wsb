function LoggingFilter() {
  this.handle = (requestOptions, next) => {
    console.log(requestOptions);
    next(requestOptions, (returnObject, finalCallback, next) => {
      console.log(returnObject);
    });
  };
}

const storage = require("azure-storage");
const uuid = require("uuid");
const retryOperation = new storage.LinearRetryPolicyFilter();
const loggingOperation = new LoggingFilter();
const service = storage
  .createTableService()
// .withFilter(loggingOperation)
// .withFilter(retryOperation);
const table = "tasks";

const init = async () =>
  new Promise((resolve, reject) => {
    service.createTableIfNotExists(table, (error, result, response) => {
      !error ? resolve() : reject();
    });
  });

const addTask = async ({
  title,
  description
}) => (
  new Promise((resolve, reject) => {
    const gen = storage.TableUtilities.entityGenerator;
    console.log("addtask - gen");
    const task = {
      PartitionKey: gen.String("task"),
      RowKey: gen.String(uuid.v4()),
      title,
      description,
    };
    console.log("addtask - task");
    service.insertEntity(table, task, (error) => {
      if (error) {
        console.log(error);
      }!error ? resolve() : reject();
    });
    console.log("addtask - insertEntity");
  }),
  console.log("addtask - Promise")
);

const listTasks = async () =>
  new Promise((resolve, reject) => {
    const query = new storage.TableQuery()
      .select(["title", "description", "Timestamp"])
      .where("PartitionKey eq ?", "task");

    service.queryEntities(table, query, null, (error, result) => {
      !error
        ?
        resolve(
          result.entries.map((entry) => ({
            title: entry.title._,
            description: entry.description._,
            Timestamp: entry.Timestamp._,
          }))
        ) :
        reject();
    });
  });

module.exports = {
  init,
  addTask,
  listTasks,
};