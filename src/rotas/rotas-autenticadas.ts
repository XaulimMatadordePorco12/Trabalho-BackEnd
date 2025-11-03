import {Router} from 'express'

import carrinhoController from '../carrinho/carrinho.controller.js'
import LivrosController from '../livros/livros.controller.js'

const rotas = Router()
rotas.post('/livros',LivrosController.adicionar)
rotas.get('/livros',LivrosController.listar)

rotas.post('/adicionarItem',carrinhoController.adicionarItem)
rotas.post('/removerItem',carrinhoController.removerItem)
rotas.get('/carrinho/:usuarioId',carrinhoController.listar)
rotas.delete('/carrinho/:usuarioId',carrinhoController.remover)

export default rotas