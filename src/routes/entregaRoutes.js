import React from 'react';
import { Input } from '../components/Input';
import { Select } from '../components/ui/select';

function Relatorios() {
  const today = new Date().toISOString().split('T')[0];
  const [dataInicio, setDataInicio] = React.useState(today);
  const [dataFim, setDataFim] = React.useState(today);
  const [entregadorSelecionado, setEntregadorSelecionado] = React.useState('');

  return (
    <div>
      <h1>Relatórios</h1>
      <form>
        <label htmlFor="dataInicio">Data Início:</label>
        <Input
          id="dataInicio"
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />

        <label htmlFor="dataFim">Data Fim:</label>
        <Input
          id="dataFim"
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
        />

        <div className="mb-6">
          <Label htmlFor="entregador">Entregador</Label>
          <Select id="entregador" value={entregadorSelecionado} onChange={(e) => setEntregadorSelecionado(e.target.value)}>
            <option value="">Todos</option>
            <option value="1">Entregador 1</option>
            <option value="2">Entregador 2</option>
            {/* No futuro, substitua por um map vindo da API de entregadores */}
          </Select>
        </div>

        {/* Outros campos e botões do formulário */}
      </form>
    </div>
  );
}

export default Relatorios;
