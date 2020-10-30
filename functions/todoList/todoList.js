// not meant to be run inside the graqhql-gateway function
// but just shows a copy-pastable example sibling function
// that would work with graphql-gateway
const { ApolloServer, gql } = require("apollo-server-lambda");
const faunadb = require("faunadb"),
  q = faunadb.query;

const typeDefs = gql`
  type Query {
    allTasks: [Task]
  }
  type Mutation {
    addTask(text: String!): Task
    updateTask(id: ID!): Task
    deleteTask(id: ID!): Task
  }
  type Task {
    id: ID!
    text: String!
    completed: Boolean!
  }
`;

const client = new faunadb.Client({
  secret: "fnAD5ZyVuQACAWrvGDGLeCAbHVQCTDBY5v2pWCsr",
});
const resolvers = {
  Query: {
    allTasks: async (root, args, context) => {
      try {
        const result = await client.query(
          q.Map(
            q.Paginate(q.Match(q.Index("all_tasks"))),
            q.Lambda((x) => q.Get(x))
          )
        );
        const data = result.data.map((d) => {
          return {
            id: d.ts,
            completed: d.data.completed,
            text: d.data.text,
          };
        });
        console.log(data);
        // console.log(result.data);

        return data;
      } catch (error) {
        console.log(error);
        return error.toString();
      }
    },
  },
  Mutation: {
    addTask: async (_, { text }) => {
      try {
        const result = await client.query(
          q.Create(q.Collection("tasks"), {
            data: {
              text,
              completed: false,
            },
          })
        );
        console.log(result.data.task);
        return result.data;
      } catch (error) {
        return error.toString();
      }
    },
    deleteTask: async (_, { id }) => {},
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

exports.handler = server.createHandler();
