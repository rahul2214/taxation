import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const taxInfo = {
  filingStatus: "Married Filing Jointly",
  dependents: [
    { name: "Leo Doe", relationship: "Son", age: 5 },
    { name: "Mia Doe", relationship: "Daughter", age: 3 },
  ],
  incomeSources: ["W-2 Employment", "Freelance (1099-NEC)", "Interest Income"],
};

export default function TaxInfoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Tax Information</h1>
        <p className="text-muted-foreground">A summary of the information used for your tax filings.</p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Filing Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">{taxInfo.filingStatus}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dependents</CardTitle>
          <CardDescription>
            You have {taxInfo.dependents.length} dependent{taxInfo.dependents.length !== 1 && 's'} listed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {taxInfo.dependents.map((dependent) => (
              <li key={dependent.name} className="flex justify-between items-center p-3 bg-secondary rounded-md">
                <div>
                  <p className="font-semibold">{dependent.name}</p>
                  <p className="text-sm text-muted-foreground">{dependent.relationship}</p>
                </div>
                <p className="text-sm text-muted-foreground">Age: {dependent.age}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Income Sources</CardTitle>
          <CardDescription>Your declared sources of income for the most recent tax year.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {taxInfo.incomeSources.map((source) => (
              <div key={source} className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                {source}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
