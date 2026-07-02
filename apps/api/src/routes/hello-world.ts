import { Hono } from 'hono';

const helloWorld = new Hono().get('/', async (c) => {
    return c.json({ body: 'Hello, world!' });
});

export default helloWorld;
