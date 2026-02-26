import http from 'http';
import handler from './api/generate';

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', async () => {
    const vercelReq = req as any;
    vercelReq.body = body ? JSON.parse(body) : {};

    const originalEnd = res.end.bind(res);
    const vercelRes = res as any;
    vercelRes.status = (code: number) => { res.statusCode = code; return vercelRes; };
    vercelRes.json = (data: any) => {
      res.setHeader('Content-Type', 'application/json');
      originalEnd(JSON.stringify(data, null, 2));
      return vercelRes;
    };
    vercelRes.end = (data?: any) => { originalEnd(data); return vercelRes; };

    try {
      await handler(vercelReq, vercelRes);
    } catch (err: any) {
      res.statusCode = 500;
      originalEnd(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
  console.log(`POST http://localhost:${PORT}/api/generate`);
});
