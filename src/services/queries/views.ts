import {client} from '$services/redis';

export const incrementView = async (itemId: string, userId: string) => {
  return client.incrementView(itemId, userId);
  // Equivelant of above line
  // const inserted = await client.pfAdd(itemsViewsKey(itemId), userId);

  // if(inserted){
  //   return Promise.all([
  //     client.hIncrBy(itemsKey(itemId), 'views', 1),
  //     client.zIncrBy(itemsByViewsKey(), 1, itemId)
  //   ]);
  // }

};
