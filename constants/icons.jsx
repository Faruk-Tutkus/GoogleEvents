import { Feather } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export const icon = {
    home: (props) => <MaterialIcons name="event" size={24} color="black"  {...props}/>, 
    eventDetailScreen: (props) => <MaterialCommunityIcons name="details" size={24} color="fff" { ...props }/>, 
    mapScreen: (props) => <MaterialCommunityIcons name='google-maps' size={24} color={'#fff'} { ...props } />,
    profileSettings: (props) => <MaterialCommunityIcons name='face-man-profile' size={24} color={'#fff'} { ...props } />  
}

