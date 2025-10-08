import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadCloud, File, X } from "lucide-react";

const uploadedFiles = [
    { name: "W2_2023_EmployerA.pdf", size: "2.1MB", status: "Verified" },
    { name: "Form_1099-INT_Bank.pdf", size: "89KB", status: "Verified" },
    { name: "Donation_Receipt.jpg", size: "1.5MB", status: "Pending" },
    { name: "Form_1098-T_University.pdf", size: "120KB", status: "Pending" },
];

const statusVariant: { [key: string]: "default" | "secondary" } = {
    "Verified": "default",
    "Pending": "secondary",
};


export default function UploadPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Documents</h1>
        <p className="text-muted-foreground">Securely upload your tax documents for processing.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Document Uploader</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-10 h-10 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG or DOC (MAX. 10MB)</p>
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" />
                </label>
            </div> 
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>
            Here are the documents you've uploaded for the current tax year.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {uploadedFiles.map((file, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium flex items-center gap-2">
                                <File className="h-4 w-4 text-muted-foreground" />
                                {file.name}
                            </TableCell>
                            <TableCell>{file.size}</TableCell>
                            <TableCell>
                                <Badge variant={statusVariant[file.status]}>{file.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
