import { createClient, defineScript } from 'redis';
import { env } from 'process';
import {
  itemsKey,
  itemsByViewsKey,
  itemsViewsKey
} from '$services/keys';

const client = createClient({
	socket: {
		host: process.env.REDIS_HOST,
		port: parseInt(env.REDIS_PORT!)
	},
	password: process.env.REDIS_PW,
	scripts: {
		 unlock: defineScript({
			NUMBER_OF_KEYS: 1,
			transformArguments(key: string, token: string){
				return [key, token]
			},
			transformReply(reply: any){
				return reply;
			},
			SCRIPT: `
				if redis.call('GET', KEYS[1]) == ARGV[1] then
					return redis.call('DEL', KEYS[1])
				end
			`
		 }),
		 addOneAndStore: defineScript({
			NUMBER_OF_KEYS: 1,
			SCRIPT: `
				return redis.call('SET', KEYS[1], 1 + tonumber(ARGV[1]))
			`,
			transformArguments(key: string, value: number){
				// ['books:count', '5']
				// EVALSHA <ID> 1 'books:count' '5'
				return [key, value.toString()];
			},
			transformReply(reply: any){
				return reply;
			}
		 }),
		 incrementView: defineScript({
			NUMBER_OF_KEYS: 3,
			SCRIPT: `
				local itemsViewsKey = KEYS[1]
				local itemsKey = KEYS[2]
				local itemsByViewsKey = KEYS[3]
				local itemId = ARGV[1]
				local userId = ARGV[2]

				local inserted = redis.call('PFADD', itemsViewsKey, userId)

				if inserted == 1 then 
					redis.call('HINCRBY', itemsKey, 'views', 1)
					redis.call('ZINCRBY', itemsByViewsKey, 1, itemId)
				end
			`,
			transformArguments(itemId: string, userId: string){
				return [
					itemsViewsKey(itemId), // -> items:views#asd
					itemsKey(itemId), // -> items#asdasd
					itemsByViewsKey(), // -> items:views
					itemId, // -> asdasd
					userId // -> u123
				];
				// EVALSHA ID 3 items:views#asd items#asdasd items:views asdasd u123
			},
			transformReply(){}
		 })
	}
});

client.on('error', (err) => console.log(err));
client.connect();

export { client };
