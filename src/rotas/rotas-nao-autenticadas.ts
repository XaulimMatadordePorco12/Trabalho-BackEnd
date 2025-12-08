import {Router} from 'express'
import usuariosController from '../usuarios/usuarios.controller.js'
import PagamentoController from '../pagamento/pagamento.controller.js' // Novo import necessário

const rotas = Router()

rotas.post('/adicionarUsuario',usuariosController.adicionar)
rotas.post('/login',usuariosController.login)

// ------------------------------------------------------------------
// Rota de Pagamento: Status da Sessão (Não precisa de autenticação)
// ------------------------------------------------------------------
rotas.get('/pagamento/session-status', PagamentoController.verificarStatusSessao);
// ------------------------------------------------------------------

export default rotas