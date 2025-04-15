import { MongoClient, ObjectId } from 'mongodb';

class RoleService {
  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI);
    this.dbName = process.env.MONGODB_DB;
  }

  async connect() {
    await this.client.connect();
    return this.client.db(this.dbName).collection('roles');
  }

  async getrole(id) {
    let connection;
    try {
      connection = await this.connect();
      return await connection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error('Error fetching role:', error);
      throw error;
    } finally {
      if (this.client) {
        await this.client.close();
      }
    }
  }

  async getroleList() {
    let connection;
    try {
      connection = await this.connect();
      return await connection.find({}).toArray();
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    } finally {
      if (this.client) {
        await this.client.close();
      }
    }
  }
}

export default RoleService;