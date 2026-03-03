import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

const mockSites = [
  { name: 'Mansfield Roof Repair', location: 'Mansfield', service: 'Roof Repair', status: 'live', leads: 24 },
  { name: 'Sandusky Storm Damage', location: 'Sandusky', service: 'Storm Damage', status: 'live', leads: 18 },
  { name: 'Huron Gutter Install', location: 'Huron', service: 'Gutters', status: 'draft', leads: 0 },
  { name: 'Mansfield Siding', location: 'Mansfield', service: 'Siding', status: 'live', leads: 11 },
  { name: 'Sandusky New Roof', location: 'Sandusky', service: 'New Roof', status: 'paused', leads: 7 },
];

const statusColor: Record<string, string> = {
  live: 'default',
  draft: 'secondary',
  paused: 'outline',
};

export default function MicrositesPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold mb-3">Microsites</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockSites.map((s, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.location}</TableCell>
              <TableCell>{s.service}</TableCell>
              <TableCell>
                <Badge variant={statusColor[s.status] as any}>{s.status}</Badge>
              </TableCell>
              <TableCell className="text-right">{s.leads}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  <FileText size={12} /> SEO Brief
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
