import {Router} from 'express'
import { Auth, checkAdmin } from '../middlewares/auth.js'

import carrinhoController from '../carrinho/carrinho.controller.js'
import LivrosController from '../livros/livros.controller.js'
import adminController from '../admin/admin.controller.js'
import PagamentoController from '../pagamento/pagamento.controller.js'

const rotas = Router()
rotas.post('/livros',[Auth, checkAdmin],LivrosController.adicionar)
rotas.get('/livros',Auth,LivrosController.listar)
rotas.put('/livros/:id', [Auth, checkAdmin], LivrosController.editar) 
rotas.delete('/livros/:id', [Auth, checkAdmin], LivrosController.remover) 

rotas.post('/pagamento/checkout-session', Auth, PagamentoController.criarSessaoCheckout)


rotas.post('/adicionarItem', Auth, carrinhoController.adicionarItem)
rotas.post('/removerItem', Auth, carrinhoController.removerItem)
rotas.post('/atualizarQuantidade', Auth, carrinhoController.atualizarQuantidade)
rotas.get('/carrinho/:usuarioId', Auth, carrinhoController.listar)
rotas.delete('/carrinho/:usuarioId', Auth, carrinhoController.remover)
rotas.put('/carrinho/item/:id', carrinhoController.atualizarItemCarrinho)


rotas.get('/admin/estatisticas', [Auth, checkAdmin], adminController.getEstatisticas)
rotas.get('/admin/usuarios', [Auth, checkAdmin], adminController.listarUsuarios)

export default rotas