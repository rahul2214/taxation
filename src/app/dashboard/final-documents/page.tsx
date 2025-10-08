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
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const finalDocuments = [
  { id: "FDOC-2023-1040", name: "2023 Federal Tax Return (Form 1040)", date: "2024-04-10", size: "1.2 MB" },
  { id: "FDOC-2023-STATE", name: "2023 State Tax Return", date: "2024-04-10", size: "850 KB" },
  { id: "FDOC-2022-1040", name: "2022 Federal Tax Return (Form 1040)", date: "2023-04-12", size: "1.1 MB" },
  { id: "FDOC-2022-STATE", name: "2022 State Tax Return", date: "2023-04-12", size: "800 KB" },
];

export default function FinalDocumentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Final Tax Documents</CardTitle>
        <CardDescription>Access and download your completed tax documents.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Name</TableHead>
              <TableHead>Date Completed</TableHead>
              <TableHead>File Size</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {finalDocuments.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.name}</TableCell>
                <TableCell>{doc.date}</TableCell>
                <TableCell>{doc.size}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
