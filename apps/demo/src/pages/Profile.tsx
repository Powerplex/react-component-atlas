import {
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Box,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NotificationsIcon from '@mui/icons-material/Notifications';

export function Profile() {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Profile Settings
        </Typography>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}
              >
                <PersonIcon sx={{ fontSize: 50 }} />
              </Avatar>
              <Box>
                <Typography variant="h5">John Doe</Typography>
                <Typography variant="body2" color="text.secondary">
                  john.doe@example.com
                </Typography>
                <Button size="small" sx={{ mt: 1 }}>
                  Change Avatar
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                label="Full Name"
                defaultValue="John Doe"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Email"
                defaultValue="john.doe@example.com"
                variant="outlined"
                type="email"
              />
              <TextField
                fullWidth
                label="Phone"
                defaultValue="+1 234 567 8900"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Location"
                defaultValue="San Francisco, CA"
                variant="outlined"
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Contact Details
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary="john.doe@example.com"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Phone"
                  secondary="+1 234 567 8900"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationOnIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Location"
                  secondary="San Francisco, CA"
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Preferences
            </Typography>
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationsIcon sx={{ mr: 1 }} />
                    Email Notifications
                  </Box>
                }
              />
              <FormControlLabel
                control={<Switch />}
                label="SMS Notifications"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Newsletter Subscription"
              />
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained" color="primary">
                Save Changes
              </Button>
              <Button variant="outlined" color="secondary">
                Cancel
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default Profile;
