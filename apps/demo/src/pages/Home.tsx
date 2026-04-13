import { Container, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';

export function Home() {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          <HomeIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Welcome to React Component Atlas Demo
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          A demo application showcasing MUI components
        </Typography>
        <Typography variant="body1" paragraph>
          This is a sample React application using Material-UI components.
          It serves as a test case for the react-component-atlas parser.
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/dashboard"
            sx={{ mr: 2 }}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            component={RouterLink}
            to="/profile"
          >
            View Profile
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default Home;
