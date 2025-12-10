import { useState, useEffect } from "react";
import api from "../../api/api";
import "./Carrinho.css";
import { Link, useNavigate } from "react-router-dom";


interface ItemCarrinho {
  id: string;
  titulo: string;
  precoUnitario: number;
  quantidade: number;
  capaUrl?: string;
  destaque?: boolean;
}

function getUsuarioIdDoStorage(): string | null {
  const usuarioStorage = localStorage.getItem('usuario');
  if (usuarioStorage) {
    try {
      const usuario = JSON.parse(usuarioStorage);
      return usuario._id;
    } catch (e) {
      console.error("Erro ao parsear usuário do localStorage", e);
      return null;
    }
  }
  return null;
}

export default function Carrinho() {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [itensFiltrados, setItensFiltrados] = useState<ItemCarrinho[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroDestaque, setFiltroDestaque] = useState<boolean | null>(null);
  const [filtroPreco, setFiltroPreco] = useState<string>("");
  
  const navigate = useNavigate();
  const email = localStorage.getItem('email');
  const tipoUsuario = localStorage.getItem('tipo');

  useEffect(() => {
    const novoTotal = itensFiltrados.reduce(
      (acc, item) => acc + (item.precoUnitario * item.quantidade),
      0
    );
    setTotal(novoTotal);
  }, [itensFiltrados]);

  // Aplicar filtros sempre que os critérios mudarem
  useEffect(() => {
    aplicarFiltros();
  }, [itens, termoBusca, filtroDestaque, filtroPreco]);

  const USUARIO_ID = getUsuarioIdDoStorage();

  useEffect(() => {
    fetchCarrinhoComDetalhes();
  }, [USUARIO_ID]);

  function aplicarFiltros() {
    let itensFiltrados = [...itens];

    // Filtro por termo de busca (nome/título)
    if (termoBusca) {
      const termoLower = termoBusca.toLowerCase();
      itensFiltrados = itensFiltrados.filter(item =>
        item.titulo.toLowerCase().includes(termoLower)
      );
    }

    // Filtro por destaque
    if (filtroDestaque !== null) {
      itensFiltrados = itensFiltrados.filter(item =>
        filtroDestaque ? item.destaque : !item.destaque
      );
    }

    // Filtro por preço
    if (filtroPreco) {
      switch (filtroPreco) {
        case "menor-50":
          itensFiltrados = itensFiltrados.filter(item => item.precoUnitario < 50);
          break;
        case "50-100":
          itensFiltrados = itensFiltrados.filter(item => 
            item.precoUnitario >= 50 && item.precoUnitario <= 100
          );
          break;
        case "maior-100":
          itensFiltrados = itensFiltrados.filter(item => item.precoUnitario > 100);
          break;
        case "menor-preco":
          itensFiltrados = [...itensFiltrados].sort((a, b) => a.precoUnitario - b.precoUnitario);
          break;
        case "maior-preco":
          itensFiltrados = [...itensFiltrados].sort((a, b) => b.precoUnitario - a.precoUnitario);
          break;
        default:
          break;
      }
    }

    setItensFiltrados(itensFiltrados);
  }

  function limparFiltros() {
    setTermoBusca("");
    setFiltroDestaque(null);
    setFiltroPreco("");
  }

  async function fetchCarrinhoComDetalhes() {
    try {
      setCarregando(true);
      const Token = localStorage.getItem('token');
      if (!Token) {
        alert("Usuário não logado.");
        setItens([]);
        setItensFiltrados([]);
        setCarregando(false);
        return;
      }

      const responseCarrinho = await api.get(`/carrinho/${USUARIO_ID}`, {
        headers: { Authorization: `Bearer ${Token}` }
      });
      
      const carrinhoData = responseCarrinho.data;

      if (!carrinhoData.itens || carrinhoData.itens.length === 0) {
        setItens([]);
        setItensFiltrados([]);
        setCarregando(false);
        return;
      }

      const responseLivros = await api.get("/livros");
      const todosLivros = responseLivros.data;

      const itensCompletos = carrinhoData.itens.map((itemCarrinho: any) => {
        const livroEncontrado = todosLivros.find((livro: any) => livro._id === itemCarrinho.produtoId);
        
        if (livroEncontrado) {
          return {
            id: itemCarrinho.produtoId,
            titulo: livroEncontrado.titulo || 'Livro sem título',
            precoUnitario: itemCarrinho.precoUnitario || livroEncontrado.preco || 0,
            quantidade: itemCarrinho.quantidade || 1,
            capaUrl: livroEncontrado.capaUrl || '',
            destaque: livroEncontrado.destaque || false,
          };
        } else {
          return {
            id: itemCarrinho.produtoId,
            titulo: `Livro (ID: ${itemCarrinho.produtoId})`,
            precoUnitario: itemCarrinho.precoUnitario || 0,
            quantidade: itemCarrinho.quantidade || 1,
            capaUrl: '',
            destaque: false,
          };
        }
      });

      setItens(itensCompletos);
      setItensFiltrados(itensCompletos);
      
    } catch (error: any) {
      console.error("Erro ao buscar carrinho:", error);
      
      if (error?.response?.status === 404) {
        setItens([]);
        setItensFiltrados([]);
      } else {
        alert("Erro ao buscar seu carrinho.");
      }
    } finally {
      setCarregando(false);
    }
  }

  async function removerItem(id: string) {
    if (!USUARIO_ID) {
      alert('Usuário não logado. Faça o login para remover itens.');
      return;
    }

    const itemRemovido = itens.find(item => item.id === id);
    const prevItens = [...itens];
    
    setItens(prev => prev.filter(item => item.id !== id));

    try {
      await api.post('/removerItem', { produtoId: id });
    } catch (error) {
      setItens(prevItens);
      console.error('Erro ao remover item do carrinho:', error);
      alert(`Não foi possível remover "${itemRemovido?.titulo}" do carrinho.`);
    }
  }

  async function alterarQuantidade(id: string, novaQtd: number) {
    if (!USUARIO_ID) {
      alert('Usuário não logado. Faça o login para alterar o carrinho.');
      return;
    }

    const novaQtdSanitizada = Math.floor(novaQtd);

    if (novaQtdSanitizada < 1) {
      const item = itens.find(it => it.id === id);
      alert(`Para remover "${item?.titulo}" do carrinho, use o botão "Remover".`);
      return;
    }

    const prevItens = [...itens];
    
    setItens(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantidade: novaQtdSanitizada } : item
      )
    );

    try {
      await api.post('/atualizarQuantidade', {
        produtoId: id,
        quantidade: novaQtdSanitizada
      });
    } catch (error) {
      setItens(prevItens);
      console.error('Erro ao alterar quantidade do carrinho:', error);
      alert('Não foi possível atualizar a quantidade do item.');
    }
  }

  async function excluirCarrinhoInteiro() {
    if (!USUARIO_ID) {
      alert('Usuário não logado.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir TODO o carrinho?')) return;

    try {
      await api.delete(`/carrinho/${USUARIO_ID}`);
      setItens([]);
      setItensFiltrados([]);
      alert('Carrinho excluído com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir carrinho:', error);
      alert('Não foi possível excluir o carrinho.');
    }
  }

  if (carregando) {
    return (
      <div>
        <nav className="navbar">
          <span>Bem-vindo, {email}</span>
          <div className="navbar-links">
            <Link to="/">Voltar para Livros</Link>
            {tipoUsuario === 'admin' && <Link to="/admin">Admin</Link>} 
            <Link to="/logout">Sair</Link>
          </div>
        </nav>
        <div className="carrinho-container">
          <h1 className="page-title">🛒 Meu Carrinho</h1>
          <p className="vazio">Carregando seu carrinho...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar">
        <span>Bem-vindo, {email}</span>
        <div className="navbar-links">
          <Link to="/">Voltar para Livros</Link>
          {tipoUsuario === 'admin' && <Link to="/admin">Admin</Link>} 
          <Link to="/logout">Sair</Link>
        </div>
      </nav>

      <div className="carrinho-container">
        <h1 className="page-title">🛒 Meu Carrinho</h1>

        {/* Filtros de Busca */}
        <div className="filtros-carrinho">
          <div className="filtro-grupo">
            <input
              type="text"
              placeholder="Buscar por nome do livro..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="filtro-input"
            />
          </div>

          <div className="filtro-grupo">
            <select 
              value={filtroDestaque === null ? "" : filtroDestaque.toString()}
              onChange={(e) => setFiltroDestaque(e.target.value === "" ? null : e.target.value === "true")}
              className="filtro-select"
            >
              <option value="">Todos os livros</option>
              <option value="true">Apenas em destaque</option>
              <option value="false">Sem destaque</option>
            </select>
          </div>

          <div className="filtro-grupo">
            <select 
              value={filtroPreco}
              onChange={(e) => setFiltroPreco(e.target.value)}
              className="filtro-select"
            >
              <option value="">Ordenar por preço</option>
              <option value="menor-preco">Menor preço</option>
              <option value="maior-preco">Maior preço</option>
              <option value="menor-50">Menor que R$ 50</option>
              <option value="50-100">R$ 50 - R$ 100</option>
              <option value="maior-100">Maior que R$ 100</option>
            </select>
          </div>

          {(termoBusca || filtroDestaque !== null || filtroPreco) && (
            <button onClick={limparFiltros} className="limpar-filtros">
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Contador de resultados */}
        {itens.length > 0 && (
          <div className="contador-resultados">
            Mostrando {itensFiltrados.length} de {itens.length} itens no carrinho
          </div>
        )}

        {itensFiltrados.length === 0 ? (
          <p className="vazio">
            {itens.length === 0 
              ? "Seu carrinho está vazio." 
              : "Nenhum item encontrado com os filtros aplicados."
            }
          </p>
        ) : (
          <>
            {itensFiltrados.map((item) => (
              <div key={item.id} className="item-carrinho">
                <img 
                  src={item.capaUrl} 
                  alt={item.titulo}
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDIwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQThBNyIvPgo8cGF0aCBkPSJNNzUgMTUwaDUwdjI1SDc1VjE1MFoiIGZpbGw9IiM5Q0E4QTciLz4KPHRleHQgeD0iMTAwIiB5PSIyMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Q0E4QTciIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+TGl2cm8gU2VtIENhcGE8L3RleHQ+Cjwvc3ZnPgo=';
                  }}
                />
                <div className="info">
                  <h2>{item.titulo}</h2>
                  {item.destaque && <span className="destaque-badge">⭐ Destaque</span>}
                  <p>R$ {item.precoUnitario.toFixed(2)}</p>
                  <div className="quantidade">
                    <button onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}>-</button>
                    <span>{item.quantidade}</span>
                    <button onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}>+</button>
                  </div>
                  <button className="remover" onClick={() => removerItem(item.id)}>
                    Remover
                  </button>
                </div>
              </div>
            ))}

            <div className="total">
              <h3>Total: R$ {total.toFixed(2)}</h3>
              <button 
                  className="finalizar" 
                  onClick={() => navigate("/finalizar-compra")}
              >
                  Finalizar Compra
              </button>
              <button 
                onClick={excluirCarrinhoInteiro}
                className="excluir-carrinho"
              >
                Excluir Carrinho
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
