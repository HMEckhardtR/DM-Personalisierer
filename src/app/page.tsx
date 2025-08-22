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
import { Upload, ArrowLeft, ArrowRight, Copy, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const [baseMessage, setBaseMessage] = useState('Hi @user, thanks so much for your support! I really appreciate it.');
  const [keyword, setKeyword] = useState('@user');
  const [csvData, setCsvData] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a .csv file.',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        const firstColumnData = rows.map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)[0].trim().replace(/^"|"$/g, '')).filter(Boolean);
        
        if(firstColumnData.length === 0) {
          toast({
            title: 'Empty or Invalid CSV',
            description: 'The CSV file is empty or could not be parsed. Please ensure it has content in the first column.',
            variant: 'destructive',
          });
          return;
        }
        
        setCsvData(firstColumnData);
        setFileName(file.name);
        setCurrentIndex(0);
        toast({
          title: 'File Uploaded Successfully',
          description: `${firstColumnData.length} users found in ${file.name}.`,
        });
      };
      reader.readAsText(file);
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

  const handleCopy = () => {
    if(generatedMessage) {
      navigator.clipboard.writeText(generatedMessage);
      toast({
        title: 'Copied to Clipboard!',
        description: 'The personalized message is ready to be pasted.',
      });
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <Card className="max-w-5xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline tracking-tight">Patreon DM Generator</CardTitle>
          <CardDescription>
            Easily generate personalized direct messages for your patrons from a CSV file.
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
                 accept=".csv"
                 className="hidden"
               />
               <Button onClick={handleUploadClick} variant="outline" className="w-full">
                 <Upload className="mr-2 h-4 w-4" />
                 Upload .csv File
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
                    <CardDescription>
                      Showing message for:{' '}
                      <span className="font-semibold text-primary">{csvData[currentIndex]}</span>
                      <span className="text-muted-foreground ml-2">({currentIndex + 1}/{csvData.length})</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-md bg-background min-h-[120px] text-sm whitespace-pre-wrap">
                      {generatedMessage}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <div className="flex gap-2">
                       <Button onClick={handlePrevious} disabled={currentIndex === 0} variant="secondary">
                        <ArrowLeft />
                        Previous
                      </Button>
                      <Button onClick={handleNext} disabled={currentIndex === csvData.length - 1} variant="secondary">
                        Next
                        <ArrowRight />
                      </Button>
                    </div>
                    <Button onClick={handleCopy} disabled={!generatedMessage}>
                      <Copy />
                      Copy Message
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                <p className="text-muted-foreground">Your generated message will appear here.</p>
                <p className="text-sm text-muted-foreground/80 mt-2">Upload a CSV file to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
