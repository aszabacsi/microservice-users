import * as redis from 'redis';
import { promisify } from 'util';

interface Cache {
  set(key: string, value: any): void;
  get(key: string): any;
}

class RedisCache implements Cache {
  
  public client: redis.RedisClient;

  constructor(connString: string) {
    this.client = redis.createClient(connString);
  }

  public set(key: string, value: any): void {

    if(typeof value === 'string') {
      this.client.set(key, value);
    }

    if(typeof value === 'number') {
      this.client.set(key, value.toString());
    }

    if(typeof value === 'object'){
      this.client.set(key, JSON.stringify(value));
    }

  }

  public get(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, value) => {
        if(err) reject(err);
        else resolve(value);
      });
    })
  }

  public hget(key: string): any {
    this.client.get(key, (err, value) => {
      if(err) console.error(err);
      return value || null;
    });
  }
  
}

export default RedisCache;