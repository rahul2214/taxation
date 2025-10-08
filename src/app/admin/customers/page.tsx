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
import { MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const customers = [
  { id: "CUST001", name: "John Smith", email: "john.s@example.com", joinDate: "2023-01-15", status: "Active", avatar: "https://picsum.photos/seed/cust1/40/40", fallback: "JS" },
  { id: "CUST002", name: "Jane Doe", email: "jane.d@example.com", joinDate: "2023-02-20", status: "Active", avatar: "https://picsum.photos/seed/cust2/40/40", fallback: "JD" },
  { id: "CUST003", name: "Peter Jones", email: "peter.j@example.com", joinDate: "2023-03-10", status: "Inactive", avatar: "https://picsum.photos/seed/cust3/40/40", fallback: "PJ" },
  { id: "CUST004", name: "Mary Johnson", email: "mary.j@example.com", joinDate: "2023-04-05", status: "Active", avatar: "https://picsum.photos/seed/cust4/40/40", fallback: "MJ" },
  { id: "CUST005", name: "David Lee", email: "david.l@example.com", joinDate: "2023-05-12", status: "Suspended", avatar: "https://picsum.photos/seed/cust5/40/40", fallback: "DL" },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    "Active": "default",
    "Inactive": "secondary",
    "Suspended": "destructive",
};

export default function CustomersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customers</CardTitle>
        <CardDescription>View and manage all registered customers.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={customer.avatar} alt={customer.name} />
                            <AvatarFallback>{customer.fallback}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{customer.name}</div>
                    </div>
                </TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.joinDate}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[customer.status] || "default"}>{customer.status}</Badge>
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
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>View Documents</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Suspend Account</DropdownMenuItem>
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
