import React, {Component} from 'react';
import FollowerItem from './follower-item';
import '../css/follow.scss';

class FollowersList extends Component {

    componentWillMount(){
        this.props.updateListFollower(this.props.activeUser);
    }

    render() {
        return (
            <div className="list-follow">
                {
                    this.props.list_follower.map((value, key)=>{
                        return <FollowerItem key={key} FollowItem={value}/>
                    })
                }
            </div>
        );
    }
}

export default FollowersList;
