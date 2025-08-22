'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, ArrowLeft, ArrowRight, Copy, FileText, Save, FolderOpen } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Home() {
  const [baseMessage, setBaseMessage] = useState('Hi @user, thanks so much for your support! I really appreciate it.');
  const [keyword, setKeyword] = useState('@user');
  const [csvData, setCsvData] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generateMessage = useCallback(() => {
    if (csvData.length > 0) {
      const currentUser = csvData[currentIndex];
      if (currentUser) {
        const keywordToReplace = keyword.trim() || '@user';
        const newGeneratedMessage = baseMessage.replace(new RegExp(keywordToReplace, 'g'), currentUser);
        setGeneratedMessage(newGeneratedMessage);
      }
    } else {
      setGeneratedMessage('');
    }
  }, [baseMessage, keyword, csvData, currentIndex]);

  useEffect(() => {
    generateMessage();
  }, [generateMessage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv');
      const isXlsx = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx');

      if (!isCsv && !isXlsx) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a .csv or .xlsx file.',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        let firstColumnData: string[] = [];
        
        try {
          const workbook = XLSX.read(data, { type: 'array', codepage: 65001 }); // 65001 is UTF-8
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          firstColumnData = json
            .map(row => String(row[0] || ''))
            .filter(value => value.trim() !== '');

          if (firstColumnData.length === 0) {
            toast({
              title: 'Empty or Invalid File',
              description: 'The file is empty or could not be parsed. Please ensure it has content in the first column.',
              variant: 'destructive',
            });
            return;
          }

          setCsvData(firstColumnData);
          setFileName(file.name);
          setCurrentIndex(0);
          toast({
            variant: 'custom',
            title: 'File Uploaded Successfully',
            description: `${firstColumnData.length} users found in ${file.name}.`,
          });

        } catch (error) {
          console.error("Error parsing file:", error);
          toast({
            title: 'File Parsing Error',
            description: 'There was an error parsing your file. Please check the file format and try again.',
            variant: 'destructive',
          });
        }
      };
      // Read both CSV and XLSX as ArrayBuffer
      reader.readAsArrayBuffer(file);
    }
  };
  
  const handleSaveTemplate = () => {
    if (!baseMessage.trim()) {
      toast({
        title: 'Empty Message',
        description: 'Cannot save an empty message template.',
        variant: 'destructive',
      });
      return;
    }
    const blob = new Blob([baseMessage], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'patreon-dm-template.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      variant: 'custom',
      title: 'Template Saved',
      description: 'Your message template has been saved as a .txt file.',
    });
  };

  const handleLoadTemplateClick = () => {
    templateInputRef.current?.click();
  };
  
  const handleTemplateFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setBaseMessage(content);
        toast({
          variant: 'custom',
          title: 'Template Loaded',
          description: 'Your message template has been loaded.',
        });
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a .txt file.',
        variant: 'destructive',
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, csvData.length - 1));
  };
  
  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const handleCopyMessage = () => {
    if(generatedMessage) {
      navigator.clipboard.writeText(generatedMessage);
      toast({
        variant: 'custom',
        title: 'Copied to Clipboard!',
        description: 'The personalized message is ready to be pasted.',
      });
    }
  };

  const handleCopyUser = () => {
    if (csvData.length > 0) {
      const currentUser = csvData[currentIndex];
      if (currentUser) {
        navigator.clipboard.writeText(currentUser);
        toast({
          variant: 'custom',
          title: 'Copied to Clipboard!',
          description: `Copied "${currentUser}" to clipboard.`,
        });
      }
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <Card className="max-w-5xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline tracking-tight">Patreon DM Generator</CardTitle>
          <CardDescription>
            Easily generate personalized direct messages for your patrons from a CSV or XLSX file.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-semibold text-foreground/90 border-b pb-2">1. Configure Your Message</h3>
            <div className="space-y-2">
              <Label htmlFor="base-message">Message Template</Label>
              <Textarea
                id="base-message"
                value={baseMessage}
                onChange={(e) => setBaseMessage(e.target.value)}
                placeholder="Enter your base message here..."
                rows={5}
                className="resize-none"
              />
            </div>
             <div className="flex gap-2">
               <input
                 type="file"
                 ref={templateInputRef}
                 onChange={handleTemplateFileChange}
                 accept=".txt"
                 className="hidden"
               />
               <Button onClick={handleSaveTemplate} variant="secondary" className="w-full">
                 <Save className="mr-2 h-4 w-4" /> Save Template
               </Button>
               <Button onClick={handleLoadTemplateClick} variant="secondary" className="w-full">
                 <FolderOpen className="mr-2 h-4 w-4" /> Load Template
               </Button>
             </div>
            <div className="space-y-2">
              <Label htmlFor="keyword">Placeholder Keyword</Label>
              <Input
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. @user"
              />
            </div>
             <div className="space-y-3">
              <Label>Upload Patrons List</Label>
               <input
                 type="file"
                 ref={fileInputRef}
                 onChange={handleFileChange}
                 accept=".csv,.xlsx"
                 className="hidden"
               />
               <Button onClick={handleUploadClick} variant="outline" className="w-full btn-nav-hover border-2 border-transparent">
                 <Upload className="mr-2 h-4 w-4" />
                 Upload .csv or .xlsx File
               </Button>
                {fileName && (
                  <div className="text-sm text-muted-foreground flex items-center justify-center p-2 bg-muted/50 rounded-md">
                    <FileText className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">{fileName}</span>
                  </div>
                )}
             </div>
          </div>
          <div className="flex flex-col gap-6">
             <h3 className="text-xl font-semibold text-foreground/90 border-b pb-2">2. Generate & Copy</h3>
            {csvData.length > 0 ? (
              <div className="space-y-6">
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                      Showing message for:{' '}
                      <span className="font-semibold text-primary bg-[#191919] rounded-md px-2 py-1">{csvData[currentIndex]}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyUser}>
                        <Copy className="h-4 w-4"/>
                      </Button>
                      <span className="text-muted-foreground ml-auto">({currentIndex + 1}/{csvData.length})</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-md bg-background min-h-[120px] text-sm whitespace-pre-wrap">
                      {generatedMessage}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <div className="flex gap-2">
                       <Button onClick={handlePrevious} disabled={currentIndex === 0} variant="secondary" className="btn-nav-hover border-2 border-transparent">
                        <ArrowLeft />
                        Previous
                      </Button>
                      <Button onClick={handleNext} disabled={currentIndex === csvData.length - 1} variant="secondary" className="btn-nav-hover border-2 border-transparent">
                        Next
                        <ArrowRight />
                      </Button>
                    </div>
                    <Button onClick={handleCopyMessage} disabled={!generatedMessage} className="btn-copy-hover border-2 border-transparent">
                      <Copy />
                      Copy Message
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                <p className="text-muted-foreground">Your generated message will appear here.</p>
                <p className="text-sm text-muted-foreground/80 mt-2">Upload a CSV or XLSX file to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
