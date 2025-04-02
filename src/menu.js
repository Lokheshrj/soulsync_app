import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import { TalkingHead } from "https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.4/modules/talkinghead.mjs";

const AvatarCard = ({ avatar, onSelect }) => {
    const avatarRef = React.useRef(null);

    React.useEffect(() => {
        let talkingHeadInstance;

        async function initializeTalkingHead() {
            if (avatarRef.current) {
                talkingHeadInstance = new TalkingHead(avatarRef.current, {
                    ttsEndpoint: "/gtts/",
                    cameraView: "upper",
                });
                await talkingHeadInstance.showAvatar({ url: avatar.link, body: "F" });
            }
        }
        initializeTalkingHead();

        return () => {
            talkingHeadInstance?.stop();
        };
    }, [avatar.link]);

    return (
        <Card sx={{
            maxWidth: 500,
            transform: "translateY(20px)",
            transition: "transform 0.3s ease-in-out", // Smooth transition
            "&:hover": {
                transform: "translateY(20px) scale(1.05)", // Zoom effect on hover
            },
        }}>
            <div ref={avatarRef} style={{ width: "300px", height: "300px", background: "black" }}></div>
            {/* <CardContent style={{ textAlign: "center" }}>
                <Typography gutterBottom variant="h6" component="div">
                    {avatar.name}
                </Typography>
            </CardContent> */}
            <CardActions style={{ justifyContent: "center" }}>
                <Button size="small" color="primary" onClick={() => onSelect(avatar.id, avatar.name, avatar.link)}>
                    {avatar.name}
                </Button>
            </CardActions>
        </Card>
    );
};

const Menu = () => {
    const navigate = useNavigate();
    const avatars = [
        { id: 1, name: "David", link: "https://models.readyplayer.me/67e941a9f4667aed0b2d743b.glb" },
        { id: 2, name: "Aishu", link: "https://models.readyplayer.me/67e93f2e9954ca6204b06560.glb" },
        { id: 3, name: "Harini", link: "https://models.readyplayer.me/67e93d3b8eb6efd8973f1018.glb" },
        { id: 4, name: "Sara", link: "https://models.readyplayer.me/67e91eeb68fbe95a3178f645.glb" },
    ];

    const handleSelectAvatar = (id, name, link) => {
        navigate("/talking-head", { state: { id, name, link } });
    };

    return (
        <div style={{
            padding: '5rem', display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center'
        }}>
            {
                avatars.map((avatar) => (
                    <AvatarCard key={avatar.id} avatar={avatar} onSelect={handleSelectAvatar} />
                ))
            }
        </div >
    );
};

export default Menu;
