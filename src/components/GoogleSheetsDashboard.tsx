import React, { useState, useEffect, useRef } from "react";
import { StorefrontProduct } from "../types";
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Check, 
  Search, 
  FileSpreadsheet, 
  Coins, 
  Undo2, 
  AlertCircle,
  HelpCircle,
  Copy,
  FolderSync,
  Sparkles,
  Percent,
  TrendingUp,
  ChevronDown
} from "lucide-react";

interface GoogleSheetsDashboardProps {
  products: StorefrontProduct[];
  onUpdateProducts: (updatedProducts: StorefrontProduct[]) => void;
  onAddLog: (newLogText: string) => void;
}

// Columns definition for the Google Sheets grid
interface Column {
  key: keyof StorefrontProduct | "margin" | "profit";
  label: string;
  letter: string;
  type: "string" | "number" | "select" | "readonly";
  width: string;
}

const COLUMNS: Column[] = [
  { key: "id", label: "Product ID", letter: "A", type: "readonly", width: "w-28" },
  { key: "name", label: "Product Name", letter: "B", type: "string", width: "w-64" },
  { key: "category", label: "Category", letter: "C", type: "select", width: "w-40" },
  { key: "buyingPrice", label: "Buying Price ($)", letter: "D", type: "number", width: "w-32" },
  { key: "price", label: "Selling Price ($)", letter: "E", type: "number", width: "w-32" },
  { key: "margin", label: "Profit Margin (%)", letter: "F", type: "number", width: "w-36" },
  { key: "profit", label: "Gross Profit ($)", letter: "G", type: "readonly", width: "w-32" },
  { key: "stockCount", label: "Stock Qty", letter: "H", type: "number", width: "w-24" },
  { key: "salesCount", label: "Sales Count", letter: "I", type: "number", width: "w-28" },
  { key: "viewsCount", label: "Views Count", letter: "J", type: "number", width: "w-28" },
  { key: "desc", label: "Description", letter: "K", type: "string", width: "w-80" },
];

const CATEGORIES = ["Hardware", "Peripherals", "Acoustics", "Optics", "Systems", "Diagnostics"];

export default function GoogleSheetsDashboard({ 
  products, 
  onUpdateProducts,
  onAddLog
}: GoogleSheetsDashboardProps) {
  // Local draft spreadsheet products
  const [localProducts, setLocalProducts] = useState<StorefrontProduct[]>(products);
  const [isDraftModified, setIsDraftModified] = useState(false);

  // Synchronize local products if live prop changes, provided they have no unsaved draft changes
  useEffect(() => {
    if (!isDraftModified) {
      setLocalProducts(products);
    }
  }, [products, isDraftModified]);

  // Selection and edit coordinates in the sheet grid
  const [selectedCell, setSelectedCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  
  // Spreadsheet actions & utility modal triggers
  const [searchQuery, setSearchQuery] = useState("");
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing">("synced");
  const [statusTimer, setStatusTimer] = useState<string | null>(null);
  const [csvPasteMode, setCsvPasteMode] = useState(false);
  const [csvPasteText, setCsvPasteText] = useState("");
  const [multiplierAmount, setMultiplierAmount] = useState<number>(10);
  const [showFormulaDocs, setShowFormulaDocs] = useState(false);
  const [aiCategorizing, setAiCategorizing] = useState(false);

  // Deploy to live storefront handler
  const handleDeployToStorefront = () => {
    onUpdateProducts(localProducts);
    setIsDraftModified(false);
    triggerSyncIndicator();
    onAddLog(`[CATALOG-DEPLOY] ${new Date().toLocaleTimeString()}: Deployed spreadsheet catalog data (${localProducts.length} items) successfully to the live Storefront.`);
    alert(`Successfully deployed all ${localProducts.length} items to the live Storefront catalog! All changes are now live and interactive for customers.`);
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Focus utility when an input field is triggered
  useEffect(() => {
    if (editingCell) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
        if (selectRef.current) {
          selectRef.current.focus();
        }
      }, 50);
    }
  }, [editingCell]);

  // Flash saving trigger to show active google sheets cloud visual integration
  const triggerSyncIndicator = () => {
    setSyncStatus("syncing");
    setTimeout(() => {
      setSyncStatus("synced");
      setStatusTimer(new Date().toLocaleTimeString());
    }, 400);
  };

  // Helper margin & profit calculation functions
  const calculateMargin = (sell: number, buy: number) => {
    if (!sell || sell <= 0) return 0;
    return Math.round(((sell - buy) / sell) * 10000) / 100;
  };

  const calculateProfit = (sell: number, buy: number) => {
    return Math.round((sell - buy) * 100) / 100;
  };

  // Handle single grid cell modifications
  const handleCellChange = (rowId: string, colKey: string, newValue: string) => {
    triggerSyncIndicator();
    setIsDraftModified(true);
    
    const updated = localProducts.map((prod) => {
      if (prod.id !== rowId) return prod;

      const updatedProd = { ...prod };
      const valStr = newValue.trim();

      // Implement field type updates
      if (colKey === "name") {
        updatedProd.name = valStr || "Untitled Product";
      } else if (colKey === "desc") {
        updatedProd.desc = valStr || "Product Description";
      } else if (colKey === "category") {
        updatedProd.category = valStr;
      } else if (colKey === "buyingPrice") {
        const num = Math.max(0, parseFloat(valStr) || 0);
        updatedProd.buyingPrice = num;
        // Keep selling price, recalculate profit margin
        const currentSell = updatedProd.price || 0;
        updatedProd.discountPercentage = Math.round(((updatedProd.msrp || currentSell * 1.2 - currentSell) / (updatedProd.msrp || currentSell * 1.2)) * 100) || 15;
      } else if (colKey === "price") {
        const num = Math.max(0.01, parseFloat(valStr) || 0.01);
        updatedProd.price = num;
        // Adjust MSRP to match standard discount index ratio if applicable
        if (updatedProd.msrp && updatedProd.msrp < num) {
          updatedProd.msrp = Math.round(num * 1.2 * 100) / 100;
        }
      } else if (colKey === "margin") {
        // Recalculately derive brand-new Selling Price based on the targeted margin input!
        // Selling Price = Buying Price / (1 - Margin/100)
        const marginPct = parseFloat(valStr) || 0;
        const buyPrice = updatedProd.buyingPrice || 0;
        
        let newSell = buyPrice;
        if (marginPct < 100 && marginPct > -1000) {
          const divisor = 1 - (marginPct / 100);
          if (divisor !== 0) {
            newSell = Math.round((buyPrice / divisor) * 100) / 100;
          }
        }
        
        updatedProd.price = Math.max(0.01, newSell);
      } else if (colKey === "stockCount") {
        updatedProd.stockCount = Math.max(0, parseInt(valStr) || 0);
      } else if (colKey === "salesCount") {
        updatedProd.salesCount = Math.max(0, parseInt(valStr) || 0);
      } else if (colKey === "viewsCount") {
        updatedProd.viewsCount = Math.max(0, parseInt(valStr) || 0);
      }

      return updatedProd;
    });

    setLocalProducts(updated);
    
    // Log change to local streaming audit trails
    const originalProd = localProducts.find(p => p.id === rowId);
    if (originalProd) {
      if (colKey === "price" || colKey === "buyingPrice" || colKey === "margin") {
        onAddLog(`[SHEET-FORMULA-CALC] ${new Date().toLocaleTimeString()}: Recalculating formula on "${originalProd.name}". Updated '${colKey}' to ${newValue}. Net wholesale profit margin is now ${calculateMargin(updated.find(p=>p.id === rowId)?.price || 0, updated.find(p=>p.id === rowId)?.buyingPrice || 0)}% ($${calculateProfit(updated.find(p=>p.id === rowId)?.price || 0, updated.find(p=>p.id === rowId)?.buyingPrice || 0)} gross).`);
      } else {
        onAddLog(`[SHEET-SYNC] ${new Date().toLocaleTimeString()}: Grid row update applied to "${originalProd.name}" column '${colKey}' with value: "${newValue}".`);
      }
    }
  };

  // Keyboard navigate handles (Enter to save, Tab to move, Escape to abort)
  const handleKeyDown = (e: React.KeyboardEvent, rowId: string, colKey: string) => {
    if (e.key === "Enter") {
      handleCellChange(rowId, colKey, editValue);
      setEditingCell(null);
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  // Double click cell trigger
  const triggerEdit = (rowId: string, colKey: string, currentValue: any) => {
    const colObj = COLUMNS.find(c => c.key === colKey);
    if (!colObj || colObj.type === "readonly") return; // Read Only target
    
    setEditingCell({ rowId, colKey });
    setEditValue(currentValue?.toString() ?? "");
  };

  // Single cell selection to power active formula bar
  const triggerSelect = (rowId: string, colKey: string) => {
    setSelectedCell({ rowId, colKey });
    const prod = localProducts.find(p => p.id === rowId);
    const colObj = COLUMNS.find(c => c.key === colKey);
    if (prod && colObj) {
      let val = "";
      if (colKey === "margin") {
        val = `${calculateMargin(prod.price, prod.buyingPrice || 0)}%`;
      } else if (colKey === "profit") {
        val = `$${calculateProfit(prod.price, prod.buyingPrice || 0).toFixed(2)}`;
      } else {
        val = (prod[colKey as keyof StorefrontProduct] ?? "").toString();
      }
      setEditValue(val);
    }
  };

  // Handle active cell values displaying beautifully in the upper formula bar
  const getSelectedCellFormulaString = () => {
    if (!selectedCell) return "Select any cell in the sheet grid to read or edit its raw values...";
    const prod = localProducts.find(p => p.id === selectedCell.rowId);
    const col = COLUMNS.find(c => c.key === selectedCell.colKey);
    if (!prod || !col) return "";

    const coordinate = `${col.letter}${localProducts.findIndex(p => p.id === selectedCell.rowId) + 1}`;
    
    if (selectedCell.colKey === "margin") {
      return `${coordinate} = (E${localProducts.findIndex(p => p.id === selectedCell.rowId) + 1} - D${localProducts.findIndex(p => p.id === selectedCell.rowId) + 1}) / E${localProducts.findIndex(p => p.id === selectedCell.rowId) + 1}  [Live calculated margin: ${calculateMargin(prod.price, prod.buyingPrice || 0)}%]`;
    }
    if (selectedCell.colKey === "profit") {
      return `${coordinate} = E${localProducts.findIndex(p => p.id === selectedCell.rowId) + 1} - D${localProducts.findIndex(p => p.id === selectedCell.rowId) + 1}  [Live calculated profit: $${calculateProfit(prod.price, prod.buyingPrice || 0).toFixed(2)}]`;
    }

    const value = prod[selectedCell.colKey as keyof StorefrontProduct] ?? "NULL";
    return `fx: [Cell Coordinate ${coordinate}] [Column: "${col.label}"] = ${value}`;
  };

  // Add standard new row
  const handleAddNewRow = () => {
    triggerSyncIndicator();
    setIsDraftModified(true);
    const newId = `p_sheet_${Date.now().toString().slice(-4)}`;
    const newRow: StorefrontProduct = {
      id: newId,
      name: "New Cybernetic Hardware Mod",
      price: 299.00,
      category: "Hardware",
      desc: "High-spec custom circuit array registered through the interactive Sheets dashboard. Refine descriptions using our AI copywriting assistant.",
      salesCount: 0,
      viewsCount: 0,
      buyingPrice: 150.00,
      stockCount: 50,
      imageUrl: "" // No initial image (regardless of photos or not)
    };

    const updated = [...localProducts, newRow];
    setLocalProducts(updated);
    setSelectedCell({ rowId: newId, colKey: "name" });
    onAddLog(`[SHEET-CREATE-DRAFT] ${new Date().toLocaleTimeString()}: Registered new catalog item "${newRow.name}" (${newId}) into spreadsheet drafts. Ready to Deploy.`);
  };

  // Delete row target
  const handleDeleteRow = (rowId: string) => {
    if (localProducts.length <= 1) {
      alert("Spreadsheet safety rule: A minimum of 1 catalog item is required to preserve responsive store styling.");
      return;
    }
    triggerSyncIndicator();
    setIsDraftModified(true);
    const targeted = localProducts.find(p => p.id === rowId);
    const updated = localProducts.filter(p => p.id !== rowId);
    setLocalProducts(updated);
    setSelectedCell(null);
    setEditingCell(null);
    
    if (targeted) {
      onAddLog(`[SHEET-DELETE-DRAFT] ${new Date().toLocaleTimeString()}: Purged item "${targeted.name}" (${rowId}) from spreadsheet drafts. Ready to Deploy.`);
    }
  };

  // Spreadsheet wholesale updates: Applying global adjustments
  const applyPriceMultiplier = (percentage: number, targetField: "price" | "buyingPrice") => {
    triggerSyncIndicator();
    setIsDraftModified(true);
    const factor = 1 + (percentage / 100);
    const updated = localProducts.map(p => {
      const currentVal = p[targetField] || 0;
      const modifiedVal = Math.round(currentVal * factor * 100) / 100;
      return {
        ...p,
        [targetField]: Math.max(0.1, modifiedVal)
      };
    });
    
    setLocalProducts(updated);
    onAddLog(`[SHEET-BULK-MACRO-DRAFT] ${new Date().toLocaleTimeString()}: Scaled all items' [${targetField}] by ${percentage}% immediately inside draft.`);
  };

  // Set standard uniform profit margin for all items bulk
  const applyUniformMarginPercent = (targetMargin: number) => {
    triggerSyncIndicator();
    setIsDraftModified(true);
    const updated = localProducts.map(p => {
      const buyPrice = p.buyingPrice || 0;
      let newSell = buyPrice;
      const divisor = 1 - (targetMargin / 100);
      if (divisor > 0) {
        newSell = Math.round((buyPrice / divisor) * 100) / 100;
      }
      return {
        ...p,
        price: Math.max(0.01, newSell)
      };
    });
    setLocalProducts(updated);
    onAddLog(`[SHEET-BULK-MACRO-DRAFT] ${new Date().toLocaleTimeString()}: Set draft margin target to uniform ${targetMargin}% for all items.`);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    onAddLog(`[SHEET-EXPORT] ${new Date().toLocaleTimeString()}: Exporting database inventory rows to CSV format.`);
    
    // Create CSV content lines
    const headers = COLUMNS.map(c => `"${c.label}"`).join(",");
    const rows = localProducts.map(p => {
      const rowMargin = calculateMargin(p.price, p.buyingPrice || 0);
      const rowProfit = calculateProfit(p.price, p.buyingPrice || 0);
      return [
        `"${p.id}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        p.buyingPrice ?? 0,
        p.price,
        rowMargin,
        rowProfit,
        p.stockCount ?? 0,
        p.salesCount,
        p.viewsCount,
        `"${p.desc.replace(/"/g, '""')}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Live_Cyber_Monkey_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Bulk Importer simulation or paste-in structure
  const handleImportCSVData = () => {
    if (!csvPasteText.trim()) return;

    try {
      const lines = csvPasteText.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        alert("Invalid structure. Minimum CSV input must include headers and at least 1 record row.");
        return;
      }

      // Quick tab-separated or comma-separated parsing helper
      const updatedProductsList: StorefrontProduct[] = [...localProducts];
      let importCount = 0;

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        // Simple splitter matching quotes beautifully
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
        if (values.length < 5) continue; // ignore broken item lines

        const id = values[0] || `p_import_${Math.floor(Math.random() * 900) + 105}`;
        const name = values[1] || "Imported Product Item";
        const category = values[2] || "Accessories";
        const buyingPrice = parseFloat(values[3]) || 10.00;
        const price = parseFloat(values[4]) || 19.99;
        const stockCount = parseInt(values[5]) || 30;
        const desc = values[6] || "Imported spreadsheet bulk description.";

        // Look for matching product to update or append fresh
        const existingIdx = updatedProductsList.findIndex(p => p.id === id || p.name.toLowerCase() === name.toLowerCase());
        
        const importedData: StorefrontProduct = {
          id: existingIdx >= 0 ? updatedProductsList[existingIdx].id : id,
          name,
          category,
          buyingPrice,
          price,
          stockCount,
          salesCount: existingIdx >= 0 ? updatedProductsList[existingIdx].salesCount : 0,
          viewsCount: existingIdx >= 0 ? updatedProductsList[existingIdx].viewsCount : 45,
          desc,
          imageUrl: existingIdx >= 0 ? updatedProductsList[existingIdx].imageUrl : "" // Empty direct import image (handled elegantly in storefront fallback)
        };

        if (existingIdx >= 0) {
          updatedProductsList[existingIdx] = importedData;
        } else {
          updatedProductsList.push(importedData);
        }
        importCount++;
      }

      setLocalProducts(updatedProductsList);
      setIsDraftModified(true);
      triggerSyncIndicator();
      setCsvPasteText("");
      setCsvPasteMode(false);
      onAddLog(`[SHEET-IMPORT-DRAFT] ${new Date().toLocaleTimeString()}: Successfully imported and merged ${importCount} inventory products into draft. Hit Deploy to publish live!`);
    } catch (e) {
      alert("Error parsing CSV block. Please make sure data coordinates matches: ID, Name, Category, BuyingPrice, SellingPrice, StockCount, Description");
    }
  };

  // AI-powered categorizer for the entire catalog list
  const handleAiCategorizeAll = async () => {
    if (localProducts.length === 0) {
      alert("No products in catalog to categorize. Please add or import some products first.");
      return;
    }
    setAiCategorizing(true);
    onAddLog(`[AI-CATEGORIZE] ${new Date().toLocaleTimeString()}: Contacting Gemini core models to auto-categorize ${localProducts.length} draft products...`);
    try {
      const response = await fetch("/api/categorize-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ products: localProducts })
      });

      if (!response.ok) {
        throw new Error("Gemini categorization endpoint returned status: " + response.status);
      }

      const data = await response.json();
      if (data && Array.isArray(data.categorizations)) {
        let updatedCount = 0;
        const updated = localProducts.map(p => {
          const match = data.categorizations.find((c: any) => c.id === p.id);
          if (match && match.category) {
            const trimmedCat = match.category.trim();
            if (p.category !== trimmedCat) {
              updatedCount++;
            }
            return {
              ...p,
              category: trimmedCat
            };
          }
          return p;
        });

        setLocalProducts(updated);
        setIsDraftModified(true);
        triggerSyncIndicator();
        onAddLog(`[AI-CATEGORIZE-SUCCESS] ${new Date().toLocaleTimeString()}: Successfully auto-classified ${updatedCount} product categories inside drafts.`);
        alert(`Successfully auto-categorized all products in draft worksheet! Updated categories for ${updatedCount} products.`);
      } else {
        throw new Error("Response is missing categorizations array.");
      }
    } catch (err: any) {
      console.error(err);
      onAddLog(`[AI-CATEGORIZE-FAILED] ${new Date().toLocaleTimeString()}: Categorization failed: ${err.message || err}`);
      alert("AI Categorization failed: " + (err.message || err));
    } finally {
      setAiCategorizing(false);
    }
  };

  // Filter products by query
  const filteredProducts = localProducts.filter((prod) => {
    const q = searchQuery.toLowerCase();
    return (
      prod.name.toLowerCase().includes(q) ||
      prod.category.toLowerCase().includes(q) ||
      prod.id.toLowerCase().includes(q) ||
      prod.desc.toLowerCase().includes(q)
    );
  });

  const availableCategories = Array.from(new Set([...CATEGORIES, ...localProducts.map(p => p.category)]));

  return (
    <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden flex flex-col" id="google_sheets_module">
      
      {/* 1. TOP UTILITY BAR & BRAND DESIGN */}
      <div className="bg-slate-50 border-b border-orange-100 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-sm">
            <FileSpreadsheet className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-md font-extrabold text-slate-900 tracking-tight">Cyber Monkey Live Spreadsheet Broker</h2>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] rounded-full border border-emerald-200 font-extrabold font-mono uppercase">
                Sheets Sync v3.1
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Real-time Google Sheets grid interface. Directly modify wholesale costs, retail pricing, and targeted profit indexes.
            </p>
          </div>
        </div>

        {/* Real-time sync visual indicators */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          <div className="p-2 px-3 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Sync Engine</span>
              <span className="text-slate-700 font-bold">
                {syncStatus === 'syncing' ? "Syncing Grid Changes..." : `Cloud Synced ${statusTimer ? `at ${statusTimer}` : 'Live'}`}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowFormulaDocs(!showFormulaDocs)}
            className="p-2 px-3 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            Formula Guide
          </button>
        </div>

      </div>

      {/* 2. LIVE DOCUMENTATION DRAWER (optional helper) */}
      {showFormulaDocs && (
        <div className="bg-emerald-50/50 p-4 border-b border-emerald-200/80 text-xs text-slate-700 leading-relaxed grid grid-cols-1 md:grid-cols-3 gap-4 font-normal">
          <div className="space-y-1 bg-white p-3 rounded-xl border border-emerald-100">
            <span className="font-bold text-emerald-800 block flex items-center gap-1">
              <Percent className="w-4 h-4" /> Column F [Profit Margin %] Formula
            </span>
            <p className="text-slate-500 text-[11px]">
              Calculated as: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">((Selling - Buying) / Selling) * 100</code>. <br/>
              <strong>Interactive Override:</strong> If you input a target margin here (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded">60%</code>), Selling Price is automatically reverse-computed as <code className="bg-slate-100 px-1 py-0.5 rounded">Buying / (1 - Margin/100)</code>.
            </p>
          </div>
          <div className="space-y-1 bg-white p-3 rounded-xl border border-emerald-100">
            <span className="font-bold text-emerald-800 block flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> Column G [Gross Profit $] Formula
            </span>
            <p className="text-slate-500 text-[11px]">
              Calculated as: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Selling Price - Buying Price</code>. <br/>
              This yields your net margin per single unit sold. Syncs instantly to calculate storefront checkout totals back at the customer hub.
            </p>
          </div>
          <div className="space-y-1 bg-white p-3 rounded-xl border border-emerald-100">
            <span className="font-bold text-slate-800 block flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-500" /> Omni-Sync Logic
            </span>
            <p className="text-slate-500 text-[11px]">
              All row adjustments immediately map live content. Try launching the storefront in a second window and watch prices swap in real-time as you press <strong>Enter</strong> in this sheet.
            </p>
          </div>
        </div>
      )}

      {/* 3. SPREADSHEET TOOLBAR */}
      <div className="p-3 bg-white border-b border-orange-100 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left cluster: row & CSV actions */}
        <div className="flex flex-wrap items-center gap-2">
          {isDraftModified && (
            <span className="text-[10px] bg-amber-500 text-white font-extrabold px-2.5 py-1.5 rounded-lg border border-amber-600 uppercase tracking-wider animate-pulse flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
              Drafting Workspace
            </span>
          )}

          <button
            onClick={handleDeployToStorefront}
            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 active:scale-95 shadow-md hover:shadow-lg transition-all cursor-pointer border border-emerald-600"
            title="Publish all spreadsheet worksheet edits live to the buyer storefront!"
          >
            <FolderSync className="w-4 h-4 text-amber-300" />
            Deploy to Live Storefront
          </button>

          <button
            onClick={handleAddNewRow}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Product Row
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download this table as standard spreadsheet compatible CSV"
          >
            <Download className="w-4 h-4 text-slate-550" />
            Export CSV
          </button>

          <button
            onClick={() => setCsvPasteMode(!csvPasteMode)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-550" />
            Bulk Import
          </button>

          <button
            onClick={handleAiCategorizeAll}
            disabled={aiCategorizing}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-black flex items-center gap-1.5 active:scale-95 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="Use Gemini AI to analyze item titles and descriptions and assign optimal retail categories"
          >
            <Sparkles className={`w-4 h-4 ${aiCategorizing ? "animate-spin" : ""}`} />
            {aiCategorizing ? "AI Categorizing..." : "AI Auto-Categorize Catalog"}
          </button>
        </div>

        {/* Center/Right cluster: search & fast search filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search active sheet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-250 bg-slate-50/50 rounded-lg focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

      </div>

      {/* 4. CSV IMPORT TEXTAREA SCREEN DRAWER */}
      {csvPasteMode && (
        <div className="p-4 bg-slate-50 border-b border-orange-100 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-850 flex items-center gap-1.5">
              <FolderSync className="w-4 h-4 text-emerald-600" />
              Spreadsheet Bulk CSV Import Field
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCsvPasteText(`Product ID,Product Name,Category,Buying Price ($),Selling Price ($),Stock Qty,Description
p101,Royal Honey Jar,Food & Beverage,9.50,18.00,45,Rich wild forest natural raw amber honey
p102,Cotton Lounge Socks,Apparel,4.00,12.50,230,Cozy premium breathable socks woven with local linen yarns`)}
                className="text-[10px] text-emerald-700 font-bold underline bg-transparent"
              >
                Load Sample Template
              </button>
              <span className="text-slate-350 text-xs">|</span>
              <button
                className="text-[10px] text-slate-500 font-medium bg-transparent"
                onClick={() => setCsvPasteMode(false)}
              >
                Cancel
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
            Copy and paste rows from Microsoft Excel, Apple Numbers, or raw CSV strings. Use columns exactly in this order: <code className="bg-slate-200/80 px-1 rounded text-slate-800">ID, Name, Category, BuyingPrice, SellingPrice, StockCount, Description</code>.
          </p>
          <textarea
            value={csvPasteText}
            onChange={(e) => setCsvPasteText(e.target.value)}
            rows={5}
            placeholder='Product ID,Product Name,Category,Buying Price ($),Selling Price ($),Stock Qty,Description&#10;p8,Organic Herbal Teabag,Food & Beverage,8.00,16.50,150,Imported green chamomile blends&#10;p9,Wooden Tea Tray,Home & Living,15.50,38.00,20,Beautiful solid teak tea tray'
            className="w-full p-2.5 bg-white border border-slate-250 rounded-xl text-xs font-mono focus:outline-hidden focus:border-emerald-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={handleImportCSVData}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Confirm CSV Bulk Append
            </button>
          </div>
        </div>
      )}

      {/* 5. MULTIPLIER / FORMULA SHORTCUT OVERLAYS */}
      <div className="p-3 bg-amber-50/10 border-b border-orange-100 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
        
        <div className="flex items-center gap-2">
          <span className="font-bold flex items-center gap-1 text-slate-800 text-[11px] uppercase tracking-wider bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            <Coins className="w-3.5 h-3.5 text-amber-550 shrink-0" />
            Wholesale Macros
          </span>
          <span className="text-slate-350">|</span>
        </div>

        {/* Global markup operations */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px]">Adjust All Column values:</span>
          
          <button
            onClick={() => applyPriceMultiplier(multiplierAmount, "price")}
            className="p-1 px-2.5 bg-white border border-slate-200.5 hover:bg-slate-55 flex items-center gap-1 rounded-md text-slate-700 font-bold transition-all text-[11px] cursor-pointer"
            title="Multiply all current selling prices by selected % inflation factor"
          >
            Scale Selling Prices by +{multiplierAmount}%
          </button>

          <button
            onClick={() => applyPriceMultiplier(multiplierAmount, "buyingPrice")}
            className="p-1 px-2.5 bg-white border border-slate-200.5 hover:bg-slate-55 flex items-center gap-1 rounded-md text-slate-705 font-bold transition-all text-[11px] cursor-pointer"
            title="Scale all product buying costs instantly (Supplier inventory inflation simulation)"
          >
            Scale Buying Costs by +{multiplierAmount}%
          </button>

          <div className="flex items-center gap-1 bg-white p-0.5 px-2 rounded-md border border-slate-200">
            <span className="text-[10px] text-slate-400">Amt:</span>
            <input 
              type="number" 
              value={multiplierAmount} 
              onChange={(e) => setMultiplierAmount(parseInt(e.target.value) || 0)}
              className="w-10 bg-transparent text-center text-slate-800 font-bold focus:outline-hidden"
            />
            <span className="text-[10px] text-slate-400">%</span>
          </div>
        </div>

        <span className="hidden leading-none lg:block text-slate-350">|</span>

        {/* Margin shortcuts */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Fixed Profit Margin Lock:</span>
          <button
            onClick={() => applyUniformMarginPercent(50)}
            className="p-1 px-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Set 50% Margin
          </button>
          
          <button
            onClick={() => applyUniformMarginPercent(60)}
            className="p-1 px-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Set 60% Margin
          </button>

          <button
            onClick={() => applyUniformMarginPercent(70)}
            className="p-1 px-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Set 70% Margin
          </button>
        </div>

      </div>

      {/* 6. FORMULA BAR CONTAINER (fx) */}
      <div className="bg-slate-50/50 p-2.5 px-4 border-b border-orange-100 flex items-center gap-2">
        <span className="font-mono text-xs font-black text-slate-555 select-none bg-slate-200 p-0.5 px-2.5 rounded border border-slate-300">
          fx
        </span>
        <div className="h-5 w-[1px] bg-slate-300"></div>
        <div className="flex-1 bg-white border border-slate-200 px-3 py-1 text-xs font-semibold font-mono text-emerald-800 rounded shadow-inner truncate leading-none flex items-center">
          {getSelectedCellFormulaString()}
        </div>
      </div>

      {/* 7. THE SPREADSHEEET TABLE GRID VIEW */}
      <div className="flex-1 overflow-x-auto min-h-[420px]" id="sheet_grid_scroller">
        
        <table className="table-fixed min-w-[1700px] border-collapse" id="google_sheet_view_table">
          
          {/* Alphabet Headers row (e.g. A, B, C...) */}
          <thead>
            
            {/* Top row is A, B, C ... labels */}
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 select-none text-[11px] font-mono font-medium">
              <th className="w-14 border-r border-slate-200 py-1 bg-slate-150 align-middle text-center p-0">Row</th>
              
              {/* Special blank cell for operations columns */}
              {COLUMNS.map((col, cIdx) => (
                <th key={col.key} className={`${col.width} border-r border-slate-200 py-1 text-center font-bold align-middle p-0`}>
                  <div className="block font-bold text-slate-400 text-[10px] leading-tight select-none font-mono">
                    {col.letter}
                  </div>
                  <div className="text-[11px] text-slate-800 truncate px-2 font-bold select-text font-sans pb-0.5">
                    {col.label}
                  </div>
                </th>
              ))}

              <th className="w-24 text-center align-middle font-semibold text-slate-500 bg-slate-100 p-0">Action</th>
            </tr>

          </thead>

          {/* Grid Rows body (1, 2, 3...) */}
          <tbody>
            
            {filteredProducts.map((prod, rowIdx) => {
              const rowNum = rowIdx + 1;
              const isSelectedRow = selectedCell?.rowId === prod.id;

              // Grid calculations representation
              const marginValue = calculateMargin(prod.price, prod.buyingPrice || 0);
              const profitValue = calculateProfit(prod.price, prod.buyingPrice || 0);

              return (
                <tr 
                  key={prod.id} 
                  className={`border-b border-slate-200 text-xs font-medium font-sans hover:bg-amber-50/20 transition-colors ${
                    isSelectedRow ? "bg-emerald-50/10" : "bg-white"
                  }`}
                >
                  {/* Left row number indicator label container */}
                  <td className="border-r border-slate-200 bg-slate-100 text-slate-400 font-mono text-center select-none font-bold text-[10px] leading-none py-2 align-middle border-b">
                    {rowNum}
                  </td>

                  {/* Dynamic mapped cells */}
                  {COLUMNS.map((col) => {
                    const cellId = `${prod.id}_${col.key}`;
                    const isSelectedCell = selectedCell?.rowId === prod.id && selectedCell?.colKey === col.key;
                    const isEditing = editingCell?.rowId === prod.id && editingCell?.colKey === col.key;

                    // Read accurate value
                    let val: any = prod[col.key as keyof StorefrontProduct];
                    let displayVal = val;
                    let cellAlign = "text-left";

                    if (col.key === "margin") {
                      displayVal = `${marginValue}%`;
                      cellAlign = "text-right font-mono font-bold text-slate-700";
                    } else if (col.key === "profit") {
                      displayVal = `$${profitValue.toFixed(2)}`;
                      cellAlign = "text-right font-mono font-bold text-emerald-700";
                    } else if (col.type === "number") {
                      cellAlign = "text-right font-mono";
                      if (typeof val === "number") {
                        displayVal = col.key === "buyingPrice" || col.key === "price" ? val.toFixed(2) : val.toString();
                      }
                    }

                    // Category mapping
                    if (col.key === "category") {
                      cellAlign = "text-left font-semibold text-slate-700";
                    }

                    return (
                      <td
                        key={col.key}
                        onClick={() => triggerSelect(prod.id, col.key)}
                        onDoubleClick={() => triggerEdit(prod.id, col.key, val ?? (col.key === "margin" ? marginValue : ""))}
                        className={`border-r border-slate-200 p-1 font-sans cursor-text relative select-none align-middle ${cellAlign} ${
                          isSelectedCell ? "ring-2 ring-emerald-500 ring-inset bg-emerald-500/5" : ""
                        }`}
                        style={{ height: "36px" }}
                        id={`cell_${cellId}`}
                      >
                        {isEditing ? (
                          col.type === "select" ? (
                            <select
                              ref={selectRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => {
                                handleCellChange(prod.id, col.key, editValue);
                                setEditingCell(null);
                              }}
                              className="absolute inset-0 w-full h-full bg-white border border-emerald-500 focus:outline-hidden p-1 text-xs font-bold text-slate-800"
                            >
                              {availableCategories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, prod.id, col.key)}
                              onBlur={() => {
                                handleCellChange(prod.id, col.key, editValue);
                                setEditingCell(null);
                              }}
                              className="absolute inset-x-0 inset-y-0 w-full h-full bg-white border border-emerald-500 focus:outline-hidden px-2 text-xs font-bold text-slate-805"
                            />
                          )
                        ) : (
                          <div className="truncate px-2 leading-tight">
                            {col.key === "buyingPrice" || col.key === "price" ? "$" : ""}
                            {displayVal}
                          </div>
                        )}
                        
                        {/* Tiny bottom right grid handle pixel to make it look exactly like Google Sheets */}
                        {isSelectedCell && (
                          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-600 border border-white cursor-crosshair z-10"></div>
                        )}
                      </td>
                    );
                  })}

                  {/* Actions column - delete row button */}
                  <td className="border-r border-slate-200 text-center align-middle p-1">
                    <button
                      onClick={() => handleDeleteRow(prod.id)}
                      className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-md border border-rose-200 font-bold text-[10px] inline-flex items-center gap-1 transition-all cursor-pointer"
                      title="Delete this row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>

      {filteredProducts.length === 0 && (
        <div className="p-12 text-center bg-slate-50 border-t border-slate-200">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">No products match your search query</h4>
          <p className="text-xs text-slate-400 mt-1">Try refining your filter keyword or click &apos;Add Product Row&apos; to register a fresh one.</p>
        </div>
      )}

      {/* 8. SHEET FOOTER / STATS BAR */}
      <div className="bg-slate-100 border-t border-slate-200 p-2.5 px-4 text-xs font-mono font-semibold text-slate-500 flex flex-col md:flex-row md:items-center md:justify-between gap-2 select-none">
        <div className="flex items-center gap-4 flex-wrap">
          <span>Explore Spreadsheet Metrics:</span>
          <span className="text-slate-700">
            Total Average Markup (ROI):{" "}
            <span className="font-extrabold text-emerald-700">
              {Math.round(
                localProducts.reduce((acc, p) => acc + calculateMargin(p.price, p.buyingPrice || 0), 0) / (localProducts.length || 1)
              )}%
            </span>
          </span>
          <span className="text-slate-350">|</span>
          <span className="text-slate-705">
            Total Inventory Assets:{" "}
            <span className="font-extrabold text-slate-800">
              {localProducts.reduce((acc, p) => acc + (p.stockCount || 0), 0)} units
            </span>
          </span>
          <span className="text-slate-350">|</span>
          <span className="text-slate-705">
            Total Asset Cost:{" "}
            <span className="font-extrabold text-indigo-700">
              ${localProducts.reduce((acc, p) => acc + ((p.buyingPrice || 0) * (p.stockCount || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </span>
        </div>

        <div className="text-[10px] text-slate-400">
          *Double-click cells to modify values. Formula recalculation triggers instantly. Click Export to get CSV backup.
        </div>
      </div>

    </div>
  );
}
