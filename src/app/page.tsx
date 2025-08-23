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
import { Upload, ArrowLeft, ArrowRight, Copy, FileText, Save, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { templates } from '@/templates';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ModeToggle } from "@/components/mode-toggle";


export default function Home() {
  const [baseMessage, setBaseMessage] = useState('Hi @user, thanks so much for your support! I really appreciate it.');
  const [keyword, setKeyword] = useState('@user');
  const [csvData, setCsvData] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [manualUser, setManualUser] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [truncateAtComma, setTruncateAtComma] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generateMessage = useCallback(() => {
    let userToDisplay = manualUser.trim() || (csvData.length > 0 ? csvData[currentIndex] : '');
    
    if (truncateAtComma && !manualUser.trim()) {
        const commaIndex = userToDisplay.indexOf(',');
        if (commaIndex !== -1) {
            userToDisplay = userToDisplay.substring(0, commaIndex);
        }
    }

    if (userToDisplay) {
      const keywordToReplace = keyword.trim() || '@user';
      const newGeneratedMessage = baseMessage.replace(new RegExp(keywordToReplace, 'g'), userToDisplay);
      setGeneratedMessage(newGeneratedMessage);
    } else {
      setGeneratedMessage('');
    }
  }, [baseMessage, keyword, csvData, currentIndex, manualUser, truncateAtComma]);

  useEffect(() => {
    generateMessage();
  }, [generateMessage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        let allRows: string[] = [];
        
        try {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          allRows = json
            .map(row => String(row[0] || ''))
            .filter(value => value.trim() !== '');

          if (allRows.length === 0) {
            toast({
              title: 'Empty File',
              description: 'The uploaded file is empty or has no data in the first column.',
              variant: 'destructive',
            });
            return;
          }

          setCsvData(allRows);
          setFileName(file.name);
          setCurrentIndex(allRows.length > 1 ? 1 : 0);
          setManualUser('');
          toast({
            variant: 'custom',
            title: 'File Uploaded Successfully',
            description: `${allRows.length} rows found in ${file.name}.`,
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
      reader.readAsArrayBuffer(file);
    }
  };
  
  const handleOpenSaveDialog = () => {
    if (!baseMessage.trim()) {
      toast({
        title: 'Empty Message',
        description: 'Cannot save an empty message template.',
        variant: 'destructive',
      });
      return;
    }
    setIsSaveDialogOpen(true);
  };
  
  const handleConfirmSave = () => {
    const templateName = newTemplateName.trim() || 'patreon-dm-template';
    const blob = new Blob([baseMessage], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${templateName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      variant: 'custom',
      title: 'Template Saved',
      description: `Your message template has been saved as ${templateName}.txt.`,
    });
    setNewTemplateName('');
    setIsSaveDialogOpen(false);
  };

  const handleTemplateChange = (templateName: string) => {
    const template = templates.find(t => t.name === templateName);
    if (template) {
      setBaseMessage(template.content);
      toast({
        variant: 'custom',
        title: 'Template Loaded',
        description: `The "${templateName}" template has been loaded.`,
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, csvData.length - 1));
    setManualUser('');
  };
  
  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
    setManualUser('');
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
    const userToCopy = manualUser.trim() || (csvData.length > 0 ? csvData[currentIndex] : '');
    if (userToCopy) {
      navigator.clipboard.writeText(userToCopy);
      toast({
        variant: 'custom',
        title: 'Copied to Clipboard!',
        description: `Copied "${userToCopy}" to clipboard.`,
      });
    }
  };
  
  const handleClearFile = () => {
    setCsvData([]);
    setFileName(null);
    setCurrentIndex(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: 'File Cleared',
      description: 'The patron list has been removed.',
    });
  };

  const currentUserFromFile = csvData.length > 0 ? csvData[currentIndex] : '';
  let displayUser = manualUser.trim() || currentUserFromFile;
    if (truncateAtComma && !manualUser.trim()) {
        const commaIndex = displayUser.indexOf(',');
        if (commaIndex !== -1) {
            displayUser = displayUser.substring(0, commaIndex);
        }
    }
  const isManualMode = !!manualUser.trim();

  return (
    <>
      <main className="container mx-auto p-4 md:p-8">
        <Card className="max-w-5xl mx-auto shadow-lg">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl md:text-3xl font-headline tracking-tight">Patreon DM Generator</CardTitle>
              <CardDescription>
                Easily generate personalized direct messages for your patrons from a CSV or XLSX file.
              </CardDescription>
            </div>
            <ModeToggle />
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
               <div className="flex flex-col sm:flex-row gap-2">
                 <Button onClick={handleOpenSaveDialog} variant="outline" className="w-full btn-nav-hover border-2 border-transparent">
                   <Save className="mr-2 h-4 w-4" /> Save as New
                 </Button>
                 <Select onValueChange={handleTemplateChange}>
                  <SelectTrigger className="w-full btn-nav-hover border-2 border-transparent">
                    <SelectValue placeholder="Load a Template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.name} value={template.name}>{template.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                   <span className="sm:hidden">Upload File</span>
                   <span className="hidden sm:inline">Upload .csv or .xlsx File</span>
                 </Button>
                  {fileName && (
                    <div className="text-sm text-muted-foreground flex items-center justify-between p-2 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate">{fileName}</span>
                      </div>
                      <Button onClick={handleClearFile} variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                          <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
               </div>
            </div>
            <div className="flex flex-col gap-6">
               <h3 className="text-xl font-semibold text-foreground/90 border-b pb-2">2. Generate & Copy</h3>
              <div className="space-y-2">
                <Label htmlFor="manual-user">Manual Input (Overrides List)</Label>
                <Input
                  id="manual-user"
                  value={manualUser}
                  onChange={(e) => setManualUser(e.target.value)}
                  placeholder="Type a name to generate a one-off message..."
                />
              </div>
              {csvData.length > 0 || isManualMode ? (
                <div className="space-y-4">
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardDescription className="flex flex-col items-center gap-2">
                         <span className="text-center md:hidden">Showing message for:</span>
                        <div className="flex items-center gap-2">
                           <span className="hidden md:inline">Showing message for:</span>
                            <span className="font-semibold text-primary bg-accent text-accent-foreground dark:text-[#191919] rounded-md px-2 py-1 truncate">{displayUser}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleCopyUser}>
                              <Copy className="h-4 w-4"/>
                            </Button>
                        </div>
                        {!isManualMode && csvData.length > 0 && (
                          <span className="text-muted-foreground">({currentIndex + 1}/{csvData.length})</span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 rounded-md bg-background min-h-[120px] text-sm whitespace-pre-wrap overflow-x-auto">
                        {generatedMessage}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-center gap-2">
                      <div className="flex-1 flex justify-center gap-2">
                        <Button onClick={handlePrevious} disabled={(currentIndex === 0 && csvData.length <= 1) || isManualMode} variant="secondary" className="flex-1 max-w-[150px] btn-nav-hover border-2 border-transparent">
                          <ArrowLeft />
                          <span className="hidden sm:inline">Previous</span>
                        </Button>
                        <Button onClick={handleNext} disabled={currentIndex === csvData.length - 1 || isManualMode} variant="secondary" className="flex-1 max-w-[150px] btn-nav-hover border-2 border-transparent">
                          <span className="hidden sm:inline">Next</span>
                          <ArrowRight />
                        </Button>
                      </div>
                      <Button onClick={handleCopyMessage} disabled={!generatedMessage} className="flex-1 max-w-[180px] btn-copy-hover border-2 border-transparent">
                        <Copy />
                        <span className="hidden sm:inline">Copy Message</span>
                      </Button>
                    </CardFooter>
                  </Card>
                   {!isManualMode && csvData.length > 0 && (
                      <div className="flex items-center space-x-2 pl-1">
                        <Checkbox
                          id="truncate"
                          checked={truncateAtComma}
                          onCheckedChange={(checked) => setTruncateAtComma(!!checked)}
                        />
                        <label
                          htmlFor="truncate"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Extract name from first part of cell (split by comma)
                        </label>
                      </div>
                    )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                  <p className="text-muted-foreground">Your generated message will appear here.</p>
                  <p className="text-sm text-muted-foreground/80 mt-2">Upload a CSV or XLSX file, or use the manual input above.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-name" className="text-right">
                Name
              </Label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                maxLength={13}
                className="col-span-3"
                placeholder="My Awesome Template"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" onClick={handleConfirmSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
