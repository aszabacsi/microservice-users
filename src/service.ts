import { MongoClient, Db } from 'mongodb';
import { CredentialsEntry } from 'uhu-types';
import * as amqp from 'amqplib';
import * as events from 'events';
import RedisCache from './caching/Cache';

const service = () => {

  const cache = new RedisCache('redis://127.0.0.1:6739');

  const QUEUE = 'CREDENTIALS';

  amqp.connect('amqp://localhost').then(async (conn) => {

    const ch = await conn.createChannel();
    ch.assertQueue(QUEUE, { durable : false });
    ch.consume(QUEUE, (message) => {
      if(message) {
        console.log(JSON.parse(message.content.toString('utf8')));
      } else {
        throw new Error('Received a null message');
      }
    })

    const client = MongoClient.connect('mongodb://localhost:27017');

    client
    .then(result => result.db('users'))
    .then((db: Db) => {
      return db.createCollection<CredentialsEntry>('credentials', {
        validator: {
          $jsonSchema : {
            bsonType: "object",
            required: ['username', 'password', 'salt'],
            properties: {
              username: {
                bsonType: 'string',
                description: 'username of the user'
              },
              password: {
                bsonType: 'string',
                description: 'hashed password'
              },
              salt: {
                bsonType: 'string',
                description: 'user specific salt'
              }
            }
          }
        },
        validationLevel: 'strict'
      })
      .then(credentials => {

        credentials.createIndex({
          username: 1
        }, { unique: true })

        return credentials;

      })
      .then(credentials => credentials.insert(
        {
          username: 'user',
          password: 'hashedPwd',
          salt: 'salt'
        }
      ))
      .catch(console.error);

      const emitter = new events.EventEmitter()

      emitter.addListener('AUTH_SUCCESS', (data) => {
        console.log('AUTH_SUCCESS');
        // TODO send response to queue
      });

      emitter.addListener('AUTH_FAILURE', () => {
        console.log('AUTH_FAILURE');
        // TODO send response to queue
      });

      emitter.addListener('AUTH_REQUEST', async ({username}) => {

        console.log('AUTH_REQUEST');

        const found = await db.collection<CredentialsEntry>('credentials').findOne({
          username
        })

        if(found) {
          emitter.emit('AUTH_SUCCESS', { jwt: 'ataknasdasd' });
        } else {
          emitter.emit('AUTH_FAILURE', { jwt: undefined });
        }

      }); 

    })

    client.catch(console.error);

  });

}

export default service;