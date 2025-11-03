import { Request, Response } from 'express'
import { db } from '../database/banco-mongo.js'


class LivrosController {
    async adicionar(req: Request, res: Response) {

        const { titulo, autor, genero, preco, capaUrl, descricao, destaque } = req.body


        if (!titulo || !autor || !genero || !preco || !capaUrl || !descricao || typeof destaque !== 'boolean') {
            return res.status(400).json({
                error: "Os campos titulo, autor, genero, preco, capaUrl, descricao e destaque (booleano) são obrigatórios"
            })
        }


        const livro = {
            titulo,
            autor,
            genero,
            preco,
            capaUrl,
            descricao,
            destaque
        }


        const resultado = await db.collection('livros').insertOne(livro)


        res.status(201).json({
            ...livro,
            _id: resultado.insertedId
        })
    }

    async listar(req: Request, res: Response) {

        const livros = await db.collection('livros').find().toArray()
        res.status(200).json(livros)
    }

}


export default new LivrosController()