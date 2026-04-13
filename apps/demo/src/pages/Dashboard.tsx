import {
  Container,
  Typography,
  Grid2 as Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const stats = [
  { title: 'Total Users', value: '1,234', icon: <PeopleIcon />, color: 'primary' },
  { title: 'Revenue', value: '$45,678', icon: <TrendingUpIcon />, color: 'success' },
  { title: 'Orders', value: '892', icon: <ShoppingCartIcon />, color: 'warning' },
];

const recentOrders = [
  { id: 1, customer: 'John Doe', product: 'Product A', amount: '$120', status: 'Completed' },
  { id: 2, customer: 'Jane Smith', product: 'Product B', amount: '$85', status: 'Pending' },
  { id: 3, customer: 'Bob Johnson', product: 'Product C', amount: '$200', status: 'Completed' },
  { id: 4, customer: 'Alice Brown', product: 'Product D', amount: '$150', status: 'Shipped' },
];

export function Dashboard() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          <DashboardIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Dashboard
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {stats.map((stat) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={stat.title}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ color: `${stat.color}.main`, mr: 1 }}>
                      {stat.icon}
                    </Box>
                    <Typography variant="h6" component="div">
                      {stat.title}
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div">
                    {stat.value}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">View Details</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Recent Orders
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.product}</TableCell>
                    <TableCell align="right">{order.amount}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={
                          order.status === 'Completed'
                            ? 'success'
                            : order.status === 'Pending'
                            ? 'warning'
                            : 'info'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Container>
  );
}

export default Dashboard;
