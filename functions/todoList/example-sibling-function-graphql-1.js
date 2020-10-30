// not meant to be run inside the graqhql-gateway function
// but just shows a copy-pastable example sibling function
// that would work with graphql-gateway
const { ApolloServer, gql } = require("apollo-server-lambda");
const faunadb = require("faunadb"),
  q = faunadb.query;

const typeDefs = gql`
  type Query {
    allTasks: [Task!]
  }
  type Mutation {
    addTask(task: String!): Task
    updateTask(id: ID!): Todo
  }
  type Task {
    id: ID!
    text: String!
    completed: Boolean!
  }
`;

const resolvers = {
  Query: {
    allTasks: async (root, args, context) => {
      try {
        const adminClient = new faunadb.Client({
          secret: "fnAD5ZyVuQACAWrvGDGLeCAbHVQCTDBY5v2pWCsr",
        });
        const result = await adminClient.query(
          q.Map(
            q.Paginate(q.Match(q.Index("all_tasks"))),
            q.Lambda((x) => q.Get(x))
          )
        );

        console.log(result.ref.data);

        return [{}];
      } catch (error) {
        console.log(error);
      }
    },
    // authorByName: (root, args, context) => {
    //   console.log('hihhihi', args.name)
    //   return authors.find(x => x.name === args.name) || 'NOTFOUND'
    // },
  },
  Mutation: {
    addTask: async (_, { text }) => {
      try {
        const client = new faunadb.Client({
          secret: "fnAD5ZyVuQACAWrvGDGLeCAbHVQCTDBY5v2pWCsr",
        });
        const result = await client.query(
          q.Create(q.Collection("tasks"), {
            data: {
              text,
              completed: false,
            },
          })
        );
        return [{}];
      } catch (error) {
        return error.toString();
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

exports.handler = server.createHandler();
