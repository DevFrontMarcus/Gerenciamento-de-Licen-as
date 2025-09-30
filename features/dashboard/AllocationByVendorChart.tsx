import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// FIX: Add index signature to VendorData interface to make it compatible with recharts' data prop type.
interface VendorData {
    name: string;
    value: number;
    [key: string]: any;
}

interface AllocationByVendorChartProps {
    data: VendorData[];
}

const COLORS = ['#4f46e5', '#059669', '#f59e0b', '#dc2626', '#3b82f6', '#8b5cf6'];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="label font-bold text-gray-800 dark:text-gray-200">{`${payload[0].name}`}</p>
          <p className="intro text-primary-dark dark:text-primary-light">{`Alocações : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };


const AllocationByVendorChart: React.FC<AllocationByVendorChartProps> = ({ data }) => {
    return (
        <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ right: -10 }}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AllocationByVendorChart;
