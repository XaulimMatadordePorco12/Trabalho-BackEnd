import { Request, Response } from 'express'
import { db } from '../database/banco-mongo.js'


class AdminController {

    async getEstatisticas(req: Request, res: Response) {
        try {
            // Usamos $facet para rodar múltiplas agregações (pipelines) de uma só vez
            // na coleção 'carrinhos'.
            const [estatisticas] = await db.collection('carrinhos').aggregate([
                {
                    $facet: {
                        // Pipeline 1: Para "Carrinhos Ativos" e "Valor Total"
                        "dadosGerais": [
                            { $unwind: "$itens" }, // Desmembra o array de itens
                            {
                                $project: {
                                    usuarioId: 1, // Mantém o ID do usuário
                                    // Calcula o subtotal de CADA item
                                    itemTotal: { $multiply: ["$itens.precoUnitario", "$itens.quantidade"] }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    // Soma o subtotal de todos os itens de todos os carrinhos
                                    valorTotalGeral: { $sum: "$itemTotal" },
                                    // Cria um "set" (lista sem duplicatas) de todos os usuários que têm carrinho
                                    usuariosComCarrinho: { $addToSet: "$usuarioId" }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    valorTotalGeral: 1,
                                    // Conta o tamanho do "set" para saber a qtd de carrinhos ativos
                                    carrinhosAtivos: { $size: "$usuariosComCarrinho" }
                                }
                            }
                        ],

                        
                        "rankingItens": [
                            { $unwind: "$itens" }, 
                            { 
                                $group: { 
                                    _id: "$itens.livroId", // Agrupa pelo ID do livro
                                    // Pega o título (Issumindo que está salvo no item)
                                    titulo: { $first: "$itens.titulo" }, 
                                    // Soma as quantidades vendidas desse item
                                    totalVendido: { $sum: "$itens.quantidade" }
                                } 
                            },
                            { $sort: { totalVendido: -1 } }, // Ordena do maior para o menor
                            { $limit: 10 } // Retorna o Top 10
                        ]
                    }
                }
            ]).toArray();

            // Formata a resposta
            const resposta = {
                // Se 'dadosGerais' estiver vazio, retorna 0
                carrinhosAtivos: estatisticas?.dadosGerais[0]?.carrinhosAtivos || 0,
                valorTotalGeral: estatisticas?.dadosGerais[0]?.valorTotalGeral || 0,
                rankingItens: estatisticas?.rankingItens || []
            };

            res.status(200).json(resposta);

        } catch (error) {
            console.error("Erro ao gerar estatísticas (C2):", error);
            res.status(500).json({ mensagem: "Erro interno do servidor." });
        }
    }

    async listarUsuarios(req: Request, res: Response) {
        try {
            const usuarios = await db.collection('usuarios').find().toArray()
            const usuariosSemSenha = usuarios.map(({ senha, ...resto }) => ({ ...resto }))
            return res.status(200).json(usuariosSemSenha)
        } catch (error) {
            console.error('Erro ao listar usuários (Admin):', error)
            return res.status(500).json({ mensagem: 'Erro interno do servidor.' })
        }
    }




}

export default new AdminController()