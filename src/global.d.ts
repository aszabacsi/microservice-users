declare module 'uhu-types' {

  export interface Credentials {
    username: string,
    password: string,
  }

  export interface CredentialsEntry extends Credentials {
    salt: string
  }
  
}

