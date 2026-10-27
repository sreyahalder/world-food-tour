export type Country = {code:string;name:string;region:string;capital:string;lat:number;lng:number;historyTitle:string;historyUrl:string};
export type Dish = {id:string;name:string;description:string;rating:number;photo:string;sticker?:string};
export type Visit = {id:string;country:string;city:string;placeId:string|null;sourceUrl:string;websiteUrl?:string;status:"Visited"|"About to"|"No restaurant"|"Future";restaurant:string;address:string;neighborhood:string;lat:number|null;lng:number|null;date:string;rating:number;review:string;photos:string[];dishes:Dish[]};
export type Place = {id:string;country:string;city?:string;placeId?:string;sourceUrl?:string;name:string;address:string;area:string;lat:number;lng:number;url:string;menuUrl?:string;photo?:string;note:string};

export type MapRestaurant={id:string;name:string;address:string;city:string;borough:string;latitude:number;longitude:number;source_url:string;verified_at:string};
