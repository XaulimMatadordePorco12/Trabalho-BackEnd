import { Request, Response } from 'express'
import { db } from '../database/banco-mongo.js'


class AdminController {

    async getEstatisticas(req: Request, res: Response) {
        try {
            console.log('📊 Gerando estatísticas...');

            const [estatisticas] = await db.collection('carrinhos').aggregate([
                {
                    $facet: {
                        // Pipeline 1: DADOS GERAIS (Simples e eficiente)
                        "dadosGerais": [
                            // Garante que apenas carrinhos com itens sejam contados
                            { $match: { "itens.0": { $exists: true } } }, 
                            { $unwind: "$itens" }, 
                            {
                                $project: {
                                    usuarioId: 1, 
                                    itemTotal: { $multiply: ["$itens.precoUnitario", "$itens.quantidade"] }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    valorTotalGeral: { $sum: "$itemTotal" },
                                    carrinhosAtivos: { $addToSet: "$usuarioId" }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    carrinhosAtivos: { $size: "$carrinhosAtivos" },
                                    valorTotalGeral: 1
                                }
                            }
                        ],
                        // Pipeline 2: RANKING DE ITENS (Lookup corrigido para tipo de ID)
                        "rankingItens": [
                            { $match: { "itens.0": { $exists: true } } },
                            { $unwind: "$itens" },
                            // 🔥 CORREÇÃO CRÍTICA: Converter a string do produtoId para ObjectId
                            {
                                $addFields: {
                                    livroObjectId: {
                                        $convert: {
                                            input: "$itens.produtoId",
                                            to: "objectId",
                                            onError: null,
                                            onNull: null
                                        }
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: "livros",
                                    // Agora o localField é o ObjectId convertido
                                    localField: "livroObjectId", 
                                    foreignField: "_id",
                                    as: "livroInfo"
                                }
                            },
                            // Filtro que agora funciona, pois o lookup deve encontrar correspondências
                            { $match: { "livroInfo": { $ne: [] } } }, 
                            {
                                $group: {
                                    _id: "$itens.produtoId",
                                    // Pega o título do primeiro elemento do array livroInfo
                                    titulo: { 
                                        $first: { 
                                            $arrayElemAt: ["$livroInfo.titulo", 0] 
                                        } 
                                    }, 
                                    totalVendido: { $sum: "$itens.quantidade" }
                                } 
                            },
                            { $sort: { totalVendido: -1 } },
                            { $limit: 10 }
                        ]
                    }
                }
            ]).toArray();

            // Formata a resposta
            const resposta = {
                carrinhosAtivos: estatisticas?.dadosGerais[0]?.carrinhosAtivos || 0,
                valorTotalGeral: estatisticas?.dadosGerais[0]?.valorTotalGeral || 0,
                rankingItens: estatisticas?.rankingItens || []
            };

            res.status(200).json(resposta);

        } catch (error) {
            console.error("Erro ao gerar estatísticas:", error);
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