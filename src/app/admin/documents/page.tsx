import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Download, CheckCircle, AlertTriangle } from "lucide-react";

const documents = [
  { id: "DOC001", client: "John Smith", document: "W-2 Form", uploaded: "2024-03-15", status: "Verified" },
  { id: "DOC002", client: "Jane Doe", document: "1099-MISC", uploaded: "2024-03-18", status: "Verified" },
  { id: "DOC003", client: "Peter Jones", document: "Form 1098-T", uploaded: "2024-03-20", status: "Pending" },
  { id: "DOC004", client: "Mary Johnson", document: "Donation Receipts", uploaded: "2024-03-22", status: "Pending" },
  { id: "DOC005", client: "David Lee", document: "W-2 Form", uploaded: "2024-03-25", status: "Requires Attention" },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    "Verified": "default",
    "Pending": "secondary",
    "Requires Attention": "destructive",
};

const statusIcon: { [key: string]: React.ReactNode } = {
    "Verified": <CheckCircle className="h-4 w-4 text-green-500" />,
    "Pending": null,
    "Requires Attention": <AlertTriangle className="h-4 w-4 text-destructive" />,
}

export default function DocumentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Tax Documents</CardTitle>
        <CardDescription>Review and manage all uploaded tax documents.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doc ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Uploaded On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.id}</TableCell>
                <TableCell>{doc.client}</TableCell>
                <TableCell>{doc.document}</TableCell>
                <TableCell>{doc.uploaded}</TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <Badge variant={statusVariant[doc.status] || "default"}>{doc.status}</Badge>
                        {statusIcon[doc.status]}
                    </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Download className="mr-2 h-4 w-4" />Download</DropdownMenuItem>
                      <DropdownMenuItem>Mark as Verified</DropdownMenuItem>
                      <DropdownMenuItem>Request Correction</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
