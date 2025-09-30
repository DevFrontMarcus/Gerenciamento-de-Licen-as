import React, { useState, useContext, useMemo, useRef, useCallback } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { ImportResult, ImportIssue } from '../../types';
import { REQUIRED_COLUMNS, OPTIONAL_COLUMNS, ImportColumn } from './importValidation';
import { CloseIcon, DeleteIcon, ImportIcon } from '../../components/IconComponents';

type ImportStep = 'upload' | 'map' | 'review' | 'result';

const ImportPage: React.FC = () => {
    const { importDataFromCSV } = useContext(AppContext);
    
    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [fileHeaders, setFileHeaders] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationResult, setValidationResult] = useState<ImportResult | null>(null);
    
    const [columnMap, setColumnMap] = useState<Record<string, string>>({});
    
    const unmappedHeaders = useMemo(() => {
        const mapped = new Set(Object.values(columnMap));
        return fileHeaders.filter(h => !mapped.has(h));
    }, [fileHeaders, columnMap]);
    
    const resetState = useCallback(() => {
        setStep('upload');
        setFile(null);
        setFileHeaders([]);
        setColumnMap({});
        setIsProcessing(false);
        setValidationResult(null);
    }, []);

    const processFile = useCallback(async (selectedFile: File) => {
        if (!selectedFile) return;

        resetState();
        setFile(selectedFile);
        setIsProcessing(true);

        try {
            const text = await selectedFile.text();
            const allLines = text.split(/[\r\n]+/).filter(line => line.trim() !== '');
            if (allLines.length < 1) throw new Error("Arquivo CSV está vazio ou inválido.");
            
            const headers = allLines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            
            setFileHeaders(headers);

            const newMap: Record<string, string> = {};
            const mappedHeaders = new Set<string>();
            
            [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].forEach(col => {
                const foundHeader = headers.find(h => !mappedHeaders.has(h) && col.aliases.some(alias => h.toLowerCase().includes(alias)));
                if (foundHeader) {
                    newMap[col.id] = foundHeader;
                    mappedHeaders.add(foundHeader);
                }
            });
            setColumnMap(newMap);
            setStep('map');
        } catch (error: any) {
            alert(`Erro ao ler o arquivo: ${error.message}`);
            resetState();
        } finally {
            setIsProcessing(false);
        }
    }, [resetState]);
    
    const handleValidate = async () => {
        if (!file) return;
        setIsProcessing(true);
        setStep('review');
        try {
            const result = await importDataFromCSV(file, columnMap, true); // dryRun = true
            setValidationResult(result);
        } catch (e) {
            console.error(e);
            alert("Ocorreu um erro inesperado durante a validação.");
            setStep('map'); 
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = async () => {
        if (!file) return;
        setIsProcessing(true);
        setStep('result');
        try {
            const result = await importDataFromCSV(file, columnMap, false); // dryRun = false
            setValidationResult(result); 
        } catch (e) {
            console.error(e);
            alert("Ocorreu um erro inesperado durante a importação.");
            setStep('review'); 
        } finally {
            setIsProcessing(false);
        }
    };

    const isMappingComplete = useMemo(() => {
        return REQUIRED_COLUMNS.every(col => columnMap[col.id] && columnMap[col.id] !== '');
    }, [columnMap]);

    const renderContent = () => {
        switch (step) {
            case 'upload': return <UploadStep onFileSelect={processFile} isProcessing={isProcessing} />;
            case 'map': return <MapStep 
                                unmappedHeaders={unmappedHeaders}
                                columnMap={columnMap}
                                setColumnMap={setColumnMap}
                                onNext={handleValidate} 
                                onBack={resetState} 
                                isMappingComplete={isMappingComplete} 
                              />;
            case 'review': return <ReviewStep result={validationResult} onConfirm={handleImport} onBack={() => setStep('map')} isProcessing={isProcessing} />;
            case 'result': return <ResultStep result={validationResult} onNewImport={resetState} />;
            default: return null;
        }
    };

    return (
        <div>
            <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-xl p-6 sm:p-8 min-h-[600px] flex flex-col">
                <Stepper currentStep={step} />
                <div className="mt-8 flex-grow">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

// --- Helper & Step Components ---

const Stepper: React.FC<{ currentStep: ImportStep }> = ({ currentStep }) => {
    const steps: { id: ImportStep; name: string }[] = [
        { id: 'upload', name: 'Upload' },
        { id: 'map', name: 'Mapeamento' },
        { id: 'review', name: 'Revisão' },
        { id: 'result', name: 'Resultado' },
    ];
    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="flex items-center w-full">
            {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                    <div className="flex items-center text-center flex-col">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors duration-500 ${index <= currentIndex ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            {index < currentIndex ? '✔' : index + 1}
                        </div>
                        <p className={`mt-2 font-medium text-sm ${index <= currentIndex ? 'text-primary dark:text-primary-light' : 'text-gray-500'}`}>{step.name}</p>
                    </div>
                    {index < steps.length - 1 && <div className={`flex-1 h-1 mx-4 transition-colors duration-500 ${index < currentIndex ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}></div>}
                </React.Fragment>
            ))}
        </div>
    );
};

const UploadStep: React.FC<{ onFileSelect: (file: File) => void, isProcessing: boolean }> = ({ onFileSelect, isProcessing }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type === "text/csv") {
            onFileSelect(file);
        } else {
            alert("Por favor, solte um arquivo .csv válido.");
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
             <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Importar Dados via CSV</h1>
             <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">Arraste um arquivo ou clique para selecionar e inicie o processo de importação guiada.</p>
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-lg p-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-300 ${isDragging ? 'border-primary bg-indigo-50 dark:bg-primary/10' : 'border-gray-300 dark:border-gray-600 hover:border-primary'}`}
            >
                <input type="file" accept=".csv" onChange={onFileChange} className="hidden" ref={fileInputRef} disabled={isProcessing}/>
                {isProcessing ? (
                    <div className="text-lg font-semibold text-primary">Analisando Arquivo...</div>
                ) : (
                    <div className="flex flex-col items-center">
                        <ImportIcon className="w-12 h-12 text-gray-400 mb-4"/>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Arraste e solte o arquivo aqui</p>
                        <p className="text-gray-500 text-sm mt-2">ou clique para selecionar</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const DraggableHeader: React.FC<{ name: string }> = ({ name }) => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("text/plain", name);
    };
    return (
        <div 
            draggable 
            onDragStart={handleDragStart} 
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-md text-sm font-medium cursor-grab active:cursor-grabbing shadow-sm"
        >
            {name}
        </div>
    );
};

const DropTarget: React.FC<{
    column: ImportColumn,
    mappedHeader: string | undefined,
    onDrop: (fieldId: string, header: string) => void,
    onRemove: (fieldId: string) => void,
}> = ({ column, mappedHeader, onDrop, onRemove }) => {
    const [isOver, setIsOver] = useState(false);
    const isRequired = REQUIRED_COLUMNS.some(c => c.id === column.id);
    const isUnmappedAndRequired = isRequired && !mappedHeader;

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
        const header = e.dataTransfer.getData("text/plain");
        onDrop(column.id, header);
    };

    return (
        <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-3 border rounded-lg transition-all duration-300 ${isOver ? 'border-primary bg-indigo-50 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700'} ${isUnmappedAndRequired ? 'border-red-500' : ''}`}
        >
            <div className="flex justify-between items-center mb-2">
                <label htmlFor={column.id} className="block text-sm font-semibold">
                    {column.name}{isRequired && <span className="text-red-500">*</span>}
                </label>
                {isUnmappedAndRequired && <span className="text-xs text-red-500 font-bold">OBRIGATÓRIO</span>}
            </div>
            <div className="bg-white dark:bg-dark-secondary min-h-[40px] rounded-md flex items-center justify-center p-2">
                {mappedHeader ? (
                     <div className="bg-primary text-white px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2">
                        <span>{mappedHeader}</span>
                        <button onClick={() => onRemove(column.id)} className="text-indigo-200 hover:text-white"><CloseIcon className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <span className="text-xs text-gray-400">Arraste uma coluna aqui</span>
                )}
            </div>
        </div>
    );
};


const MapStep: React.FC<{
    unmappedHeaders: string[],
    columnMap: Record<string, string>,
    setColumnMap: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    onNext: () => void,
    onBack: () => void,
    isMappingComplete: boolean,
}> = ({ unmappedHeaders, columnMap, setColumnMap, onNext, onBack, isMappingComplete }) => {

    const handleDrop = (fieldId: string, header: string) => {
        setColumnMap(prev => {
            const newMap = {...prev};
            // If this header was mapped to another field, unmap it first
            const oldField = Object.keys(newMap).find(key => newMap[key] === header);
            if(oldField) {
              delete newMap[oldField];
            }
            newMap[fieldId] = header;
            return newMap;
        });
    };

    const handleRemove = (fieldId: string) => {
        setColumnMap(prev => {
            const newMap = {...prev};
            delete newMap[fieldId];
            return newMap;
        });
    };
    
    const clearMapping = () => {
        setColumnMap({});
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow">
                <div className="flex justify-between items-center mb-2">
                     <div>
                        <h2 className="text-2xl font-semibold">Mapeie as Colunas</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Arraste as colunas do seu arquivo (direita) para os campos do sistema (esquerda).</p>
                    </div>
                    <button onClick={clearMapping} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        <DeleteIcon className="w-4 h-4 mr-1" />
                        Limpar Mapeamento
                    </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    <div className="lg:col-span-2 bg-gray-50 dark:bg-black/20 p-4 rounded-lg">
                        <h3 className="font-bold mb-4 text-center">Campos do Sistema</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].map(col => (
                                <DropTarget key={col.id} column={col} mappedHeader={columnMap[col.id]} onDrop={handleDrop} onRemove={handleRemove} />
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-lg">
                        <h3 className="font-bold mb-4 text-center">Colunas do seu Arquivo</h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {unmappedHeaders.map(h => <DraggableHeader key={h} name={h} />)}
                            {unmappedHeaders.length === 0 && <p className="text-sm text-gray-500 mt-4">Todas as colunas foram mapeadas!</p>}
                        </div>
                    </div>
                </div>
            </div>
        
            <div className="pt-6 flex justify-between items-center mt-auto">
                <button onClick={onBack} className="py-2 px-4 font-bold rounded-lg transition-colors duration-300 bg-white dark:bg-dark-secondary border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">Voltar</button>
                <button onClick={onNext} disabled={!isMappingComplete} className="text-white font-bold py-2 px-4 rounded-lg bg-gradient-primary shadow-lg transition-all duration-300 transform enabled:hover:-translate-y-px enabled:hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    Revisar e Validar
                </button>
            </div>
        </div>
    );
};

const ResultDisplay: React.FC<{ result: ImportResult; isReview: boolean }> = ({ result, isReview }) => (
     <div className="space-y-6 mt-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="bg-green-100 dark:bg-green-900/50 p-4 rounded-lg"><p className="text-2xl font-bold text-green-800 dark:text-green-200">{result.ok}</p><p className="text-sm font-medium">{isReview ? "Válidos" : "Importados"}</p></div>
            <div className="bg-yellow-100 dark:bg-yellow-900/50 p-4 rounded-lg"><p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{result.warnings.length}</p><p className="text-sm font-medium">Avisos</p></div>
            <div className="bg-orange-100 dark:bg-orange-900/50 p-4 rounded-lg"><p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{result.duplicates.length}</p><p className="text-sm font-medium">Duplicatas</p></div>
            <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-lg"><p className="text-2xl font-bold text-red-800 dark:text-red-200">{result.errors.length}</p><p className="text-sm font-medium">Erros</p></div>
        </div>
        {[
            { title: "Erros (impedem a importação da linha)", items: result.errors, color: "red" },
            { title: "Duplicatas (linhas ignoradas)", items: result.duplicates, color: "orange" },
            { title: "Avisos (importado com observações)", items: result.warnings, color: "yellow" },
        ].map(section => section.items.length > 0 && (
            <div key={section.title}>
                <h3 className={`font-semibold mb-2 text-lg text-${section.color}-600 dark:text-${section.color}-400`}>{section.title}</h3>
                <div className="max-h-48 overflow-auto text-sm space-y-2 border p-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/20 dark:border-gray-700">
                    {section.items.map((item, i) => (
                        <div key={i} className={`p-2 bg-white dark:bg-dark-secondary rounded shadow-sm border-l-4 border-${section.color}-500`}>
                            <p><b>Linha {item.rowIndex}:</b> <span className={`font-medium`}>{item.message}</span></p>
                            <p className="text-xs text-gray-500 truncate mt-1 font-mono"><i>{Object.values(item.rowData).join(', ')}</i></p>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

const ReviewStep: React.FC<{ result: ImportResult | null, onConfirm: () => void, onBack: () => void, isProcessing: boolean }> = ({ result, onConfirm, onBack, isProcessing }) => (
    <div className="flex flex-col h-full">
        <h2 className="text-2xl font-semibold">Revisão e Validação</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">O sistema analisou seu arquivo. Revise os erros e avisos antes de confirmar a importação.</p>
        
        <div className="flex-grow my-4">
            {isProcessing && <div className="text-center p-8 font-medium text-primary">Analisando arquivo...</div>}
            {result && <ResultDisplay result={result} isReview={true} />}
        </div>
        
        {result && (
            <div className="pt-6 flex justify-between items-center mt-auto">
                <button onClick={onBack} className="py-2 px-4 font-bold rounded-lg transition-colors duration-300 bg-white dark:bg-dark-secondary border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">Voltar</button>
                <button onClick={onConfirm} disabled={result.errors.length > 0 || result.ok === 0} className="text-white font-bold py-2 px-4 rounded-lg bg-gradient-primary shadow-lg transition-all duration-300 transform enabled:hover:-translate-y-px enabled:hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    {result.errors.length > 0 ? "Corrija os erros para importar" : `Confirmar e Importar ${result.ok} Registros`}
                </button>
            </div>
        )}
    </div>
);

const ResultStep: React.FC<{ result: ImportResult | null, onNewImport: () => void }> = ({ result, onNewImport }) => (
    <div className="flex flex-col h-full">
        <h2 className="text-2xl font-semibold">Resultado da Importação</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">O processo foi concluído. Veja o resumo abaixo.</p>
        
        <div className="flex-grow my-4">
            {result ? <ResultDisplay result={result} isReview={false} /> : <div className="text-center p-8 font-medium text-primary">Processando importação...</div>}
        </div>
        
        <div className="pt-6 flex justify-end mt-auto">
            <button onClick={onNewImport} className="text-white font-bold py-2 px-4 rounded-lg bg-gradient-secondary shadow-lg transition-all duration-300 transform hover:-translate-y-px hover:shadow-xl">Iniciar Nova Importação</button>
        </div>
    </div>
);


export default ImportPage;