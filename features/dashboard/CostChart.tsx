import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface CostChartProps {
    data: { name: string; value: number }[];
    layout?: 'horizontal' | 'vertical';
}

const formatCurrency = (value: number) => `R$${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

const formatK = (value: number) => {
    if (value >= 1000) {
        return `R$${(value / 1000).toFixed(0)}k`;
    }
    return `R$${value}`;
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="label font-bold text-gray-800 dark:text-gray-200">{`${payload[0].payload.name}`}</p>
          <p className="intro text-primary-dark dark:text-primary-light">{`Custo: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
  
    return null;
  };

const CostChart: React.FC<CostChartProps> = ({ data, layout = 'vertical' }) => {
    const isHorizontal = layout === 'horizontal';

    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    layout={layout}
                    margin={{
                        top: 5,
                        right: isHorizontal ? 30 : 30,
                        left: isHorizontal ? 60 : 20,
                        bottom: isHorizontal ? 5 : 60,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    {isHorizontal ? (
                        <>
                            <XAxis type="number" tickFormatter={formatK} tick={{ fill: '#a0aec0', fontSize: 12 }} />
                            <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#a0aec0', fontSize: 12 }} interval={0} />
                        </>
                    ) : (
                        <>
                            <XAxis dataKey="name" tick={{ fill: '#a0aec0', fontSize: 10 }} angle={-45} textAnchor="end" interval={0} height={80}/>
                            <YAxis tickFormatter={formatK} tick={{ fill: '#a0aec0', fontSize: 12 }} />
                        </>
                    )}
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(128, 128, 128, 0.1)'}} />
                    <Bar dataKey="value" name="Custo" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                       {isHorizontal && <LabelList dataKey="value" position="right" formatter={formatK} fontSize={12} fill="#a0aec0" />}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CostChart;