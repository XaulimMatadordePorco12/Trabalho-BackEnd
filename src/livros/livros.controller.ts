import { Request, Response } from 'express'
import { ObjectId } from 'bson' // Importar ObjectId para manipular IDs do MongoDB
import { db } from '../database/banco-mongo.js'


class LivrosController {
    // Adiciona um novo livro (Admin)
    async adicionar(req: Request, res: Response) {

        const { titulo, autor, genero, preco, capaUrl, descricao, destaque } = req.body

        // Validação básica dos campos
        if (!titulo || !autor || !genero || !preco || !capaUrl || !descricao || typeof destaque !== 'boolean') {
            return res.status(400).json({
                error: "Os campos titulo, autor, genero, preco, capaUrl, descricao e destaque (booleano) são obrigatórios"
            })
        }

        const livro = {
            titulo,
            autor,
            genero,
            preco: Number(preco), // Garante que o preco é um número
            capaUrl,
            descricao,
            destaque
        }

        try {
            const resultado = await db.collection('livros').insertOne(livro)

            res.status(201).json({
                ...livro,
                _id: resultado.insertedId
            })
        } catch (error) {
            console.error('Erro ao adicionar livro:', error)
            res.status(500).json({ error: 'Erro interno do servidor ao adicionar livro.' })
        }
    }

    // Lista todos os livros (Público/Autenticado)
    async listar(req: Request, res: Response) {
        try {
            const livros = await db.collection('livros').find().toArray()
            res.status(200).json(livros)
        } catch (error) {
            console.error('Erro ao listar livros:', error)
            res.status(500).json({ error: 'Erro interno do servidor ao listar livros.' })
        }
    }

    // Atualiza um livro existente pelo ID (Admin)
    async editar(req: Request, res: Response) {
        const { id } = req.params // ID do livro a ser editado
        const updateData = req.body // Dados de atualização
        
        // Remove _id se estiver presente, para evitar erro na atualização
        delete updateData._id

        if (!id) {
            return res.status(400).json({ error: "ID do livro é obrigatório." })
        }

        try {
            // Verifica se o ID é um ObjectId válido
            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ error: "ID de livro inválido." })
            }

            // Garante que o preco é um número, se estiver sendo atualizado
            if (updateData.preco !== undefined) {
                updateData.preco = Number(updateData.preco)
            }
            // Garante que o destaque é um booleano, se estiver sendo atualizado
            if (updateData.destaque !== undefined) {
                updateData.destaque = Boolean(updateData.destaque)
            }

            const resultado = await db.collection('livros').updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            )

            if (resultado.matchedCount === 0) {
                return res.status(404).json({ error: "Livro não encontrado para o ID fornecido." })
            }

            res.status(200).json({ mensagem: "Livro atualizado com sucesso!", id })
        } catch (error) {
            console.error('Erro ao editar livro:', error)
            res.status(500).json({ error: 'Erro interno do servidor ao editar livro.' })
        }
    }

    // Remove um livro pelo ID (Admin)
    async remover(req: Request, res: Response) {
        const { id } = req.params // ID do livro a ser removido

        if (!id) {
            return res.status(400).json({ error: "ID do livro é obrigatório." })
        }

        try {
            // Verifica se o ID é um ObjectId válido
            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ error: "ID de livro inválido." })
            }

            const resultado = await db.collection('livros').deleteOne({ _id: new ObjectId(id) })

            if (resultado.deletedCount === 0) {
                return res.status(404).json({ error: "Livro não encontrado para o ID fornecido." })
            }

            res.status(200).json({ mensagem: "Livro removido com sucesso!", id })
        } catch (error) {
            console.error('Erro ao remover livro:', error)
            res.status(500).json({ error: 'Erro interno do servidor ao remover livro.' })
        }
    }
}


export default new LivrosController()