import { createClient } from "redis";

export default async () => {
    const redisClient = createClient({
        url: 'redis://:bc1qvca3wgp97k5za9070ryhnjs9hr73kjdkg0jm6r@redis-12880.c90.us-east-1-3.ec2.redns.redis-cloud.com:12880'
    });

    await redisClient.connect();

    return redisClient;
}