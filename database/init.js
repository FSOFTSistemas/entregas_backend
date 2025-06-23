import React, { useState, useEffect } from 'react';
import { Button } from 'some-ui-library'; // Ajuste para o componente Button que você usa
import { formatCurrency } from '../utils/formatters';

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [mostrarTotais, setMostrarTotais] = useState(false);

  useEffect(() => {
    // Carregar produtos da API ou fonte de dados
  }, []);

  const totalCustoEstoque = produtos.reduce((acc, produto) => acc + produto.custo * produto.quantidade, 0);
  const totalVendaEstoque = produtos.reduce((acc, produto) => acc + produto.venda * produto.quantidade, 0);

  return (
    <div>
      <div className="mb-4">
        <Button size="sm" variant="outline" onClick={() => setMostrarTotais(!mostrarTotais)}>
          {mostrarTotais ? 'Ocultar Totais' : 'Totalizar Estoque'}
        </Button>
        {mostrarTotais && (
          <div className="mt-2">
            <strong>Total em Estoque (Custo): {formatCurrency(totalCustoEstoque)}</strong><br />
            <strong>Total em Estoque (Venda): {formatCurrency(totalVendaEstoque)}</strong>
          </div>
        )}
      </div>

      {/* Renderizar lista de produtos */}
      <ul>
        {produtos.map(produto => (
          <li key={produto.id}>{produto.nome}</li>
        ))}
      </ul>
    </div>
  );
}

export default Produtos;
