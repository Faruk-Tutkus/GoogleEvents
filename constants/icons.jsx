import { Feather } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export const icon = {
    home: (props) => <MaterialCommunityIcons name='food-apple' size={24} color={'#fff'} { ...props } />, 
    exercise: (props) => <MaterialCommunityIcons name="weight-lifter" size={24} color="fff" { ...props }/>, 
    recipe: (props) => <MaterialCommunityIcons name='book' size={24} color={'#fff'} { ...props } />,
    ai: (props) => <MaterialCommunityIcons name='robot' size={24} color={'#fff'} { ...props } />  
}

