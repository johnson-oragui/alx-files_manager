import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import DBCrud from '../utils/db_manager';
import redisClient from '../utils/redis';
import isValidBase64 from '../utils/validBase64';

class AuthController {
  static async getConnect(req, res) {
    try {
      // retrieve the basic auth base64 strings
      const { authorization } = req.headers;

      // return unauthorized if authorization is missing
      if (!authorization) return res.status(401).json({ error: 'Unauthorized' });

      // console.log(authorization);

      // split the authorization string to retrieve base64 string
      const base64String = authorization.split(' ')[1];

      // try to decode authorization base64 string
      const decodedBase64String = isValidBase64(base64String);

      // return aunathorized if base64 string is invalid
      if (!decodedBase64String) return res.status(401).json({ error: 'Unauthorized' });

      // console.log(decodedBase64String);

      // split the decoded base 64 string to separate email and password
      const [email, password] = decodedBase64String.split(':');

      // console.log(email, password);

      // hash the password with sha1
      const hashedPassword = sha1(password);
      // console.log(hashedPassword);

      // search for the user in the databae
      const foundUser = await DBCrud.findUser({ email, password: hashedPassword });
      // console.log(foundUser);

      // return Unauthorized if no user found
      if (!foundUser) return res.status(401).json({ error: 'Unauthorized' });

      // generate a randon uuidv4 string as a token
      const foundUserToken = uuidv4();
      // console.log(foundUserToken);

      // create a key for storing foundUserToken in redis
      const redisTokenKey = `auth_${foundUserToken}`;
      // console.log(redisTokenKey);

      // set userId to store in redis
      const userId = foundUser._id.toString();

      // store the the user id in redis using the key associated with foundUserToken
      const storeUserId = await redisClient.set(redisTokenKey, userId, 24 * 60 * 60);
      // console.log(storeUserId);

      // return error message if redisTokenKey was not successfully stored in redis
      if (storeUserId !== 'OK') return res.status(500).json({ error: 'Internal Server Error' });

      return res.status(200).json({ token: foundUserToken });
    } catch (error) {
      console.error('error in Authcontrolller getconnect', error.message);
      return res.status(500).json({ error: 'internal server error' });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await redisClient.del(`auth_${token}`);
    return res.status(204).end();
  }
}

export default AuthController;
