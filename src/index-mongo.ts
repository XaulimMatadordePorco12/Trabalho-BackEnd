import express, { Request, Response, NextFunction } from 'express'
import 'dotenv/config'
import rotasNaoAutenticadas from './rotas/rotas-nao-autenticadas.js'
import rotasAutenticadas from './rotas/rotas-autenticadas.js'
import cors from 'cors'

console.log(process.env.MONGO_URI)
const app = express()
app.use(cors())

app.use(express.json())



app.use(rotasNaoAutenticadas)
app.use(rotasAutenticadas)

// Rota de debug para listar todas as rotas registradas (útil em desenvolvimento)
app.get('/__routes', (req: Request, res: Response) => {
    const stack = (app as any)._router?.stack || [];
    const routes: Array<{ method: string; path: string }> = [];

    stack.forEach((layer: any) => {
        if (layer.route && layer.route.path) {
            const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(',');
            routes.push({ method: methods, path: layer.route.path });
        } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            layer.handle.stack.forEach((handler: any) => {
                if (handler.route && handler.route.path) {
                    const methods = Object.keys(handler.route.methods).map(m => m.toUpperCase()).join(',');
                    routes.push({ method: methods, path: handler.route.path });
                }
            })
        }
    })

    res.json(routes);
})


app.listen(8000, () => {
    console.log('Server is running on port 8000')
})